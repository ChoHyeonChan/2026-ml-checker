import pytest
from app.services.analyzer import AnalyzerService


@pytest.fixture
def analyzer():
    return AnalyzerService()


# ========== 1. 타겟 직접 사용 + 전처리 (확정위반) ==========
def test_target_leakage_clear(analyzer):
    code = """
import pandas as pd
from sklearn.preprocessing import StandardScaler

df = pd.read_csv('data.csv')
y = df['target']
scaler = StandardScaler()
X_scaled = scaler.fit_transform(df)
"""
    result = analyzer.analyze_code(code)
    assert result["classification"] == "확정위반"
    assert result["summary"]["확정위반"] >= 1


def test_target_groupby_leakage(analyzer):
    code = """
import pandas as pd

df = pd.read_csv('data.csv')
df['new_feat'] = df.groupby('target')['age'].transform('mean')
"""
    result = analyzer.analyze_code(code)
    assert result["classification"] == "확정위반"
    assert result["summary"]["확정위반"] >= 1


# ========== 2. test 데이터로 모델 fit (확정위반) ==========
def test_test_data_fit(analyzer):
    code = """
from sklearn.linear_model import LogisticRegression
model = LogisticRegression()
model.fit(X_test, y_test)
"""
    result = analyzer.analyze_code(code)
    assert result["classification"] == "확정위반"
    assert result["summary"]["확정위반"] >= 1


# ========== 3. 전체 데이터 fit/transform 후 분할 (확정위반/의심) ==========
def test_fit_before_split(analyzer):
    code = """
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import train_test_split

scaler = StandardScaler()
X_scaled = scaler.fit_transform(X)
X_train, X_test, y_train, y_test = train_test_split(X_scaled, y, test_size=0.2)
"""
    result = analyzer.analyze_code(code)
    assert result["classification"] in ("확정위반", "의심")
    assert result["summary"]["확정위반"] + result["summary"]["의심"] >= 1


# ========== 4. split 전 데이터 정제/필터링 (의심) ==========
def test_filter_before_split(analyzer):
    code = """
from sklearn.model_selection import train_test_split

df = pd.read_csv('data.csv')
df = df.dropna()
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2)
"""
    result = analyzer.analyze_code(code)
    assert result["classification"] in ("확정위반", "의심")
    assert result["summary"]["의심"] >= 1


# ========== 5. 시계열 shuffle + split (의심) ==========
def test_shuffle_temporal_split(analyzer):
    code = """
import pandas as pd
from sklearn.model_selection import train_test_split

df = pd.read_csv('sales.csv')
df = df.sample(frac=1)
df['date'] = pd.to_datetime(df['date'])
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2)
"""
    result = analyzer.analyze_code(code)
    assert result["classification"] == "의심"
    assert result["summary"]["의심"] >= 1


# ========== 6. 시계열 shift + fit (의심) ==========
def test_time_order_leakage(analyzer):
    code = """
import pandas as pd
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import train_test_split

df = pd.read_csv('sensor.csv')
df['timestamp'] = pd.to_datetime(df['timestamp'])
df['lag_1'] = df['value'].shift(1)
df = df.dropna()
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2)
scaler = StandardScaler()
X_train_scaled = scaler.fit_transform(X_train)
"""
    result = analyzer.analyze_code(code)
    # 시계열 shift 후 split 전 정제 + fit_transform은 확정위반
    assert result["summary"]["확정위반"] >= 1 or result["summary"]["의심"] >= 1


# ========== 7. cross_val + 외부 전처리 (의심) ==========
def test_cross_val_preprocess_leakage(analyzer):
    code = """
from sklearn.model_selection import cross_val_score
from sklearn.preprocessing import StandardScaler
from sklearn.linear_model import LogisticRegression

scaler = StandardScaler()
X_scaled = scaler.fit_transform(X)
scores = cross_val_score(LogisticRegression(), X_scaled, y, cv=5)
"""
    result = analyzer.analyze_code(code)
    assert result["summary"]["의심"] >= 1


# ========== 8. groupby/분할 기준 전처리 (의심) ==========
def test_groupby_split_preprocess(analyzer):
    code = """
import pandas as pd
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import train_test_split

df = pd.read_csv('data.csv')
grouped = df.groupby('category')
scaler = StandardScaler()
X_scaled = scaler.fit_transform(df.drop('target', axis=1))
X_train, X_test, y_train, y_test = train_test_split(X_scaled, y, test_size=0.2)
"""
    result = analyzer.analyze_code(code)
    # groupby + split 전 fit_transform은 확정위반
    assert result["summary"]["확정위반"] >= 1


# ========== 9. 정상 코드 (이상없음) ==========
def test_clean_code(analyzer):
    code = """
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.linear_model import LogisticRegression

X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2)
scaler = StandardScaler()
X_train_scaled = scaler.fit_transform(X_train)
X_test_scaled = scaler.transform(X_test)
model = LogisticRegression()
model.fit(X_train_scaled, y_train)
"""
    result = analyzer.analyze_code(code)
    assert result["classification"] == "이상없음"
    assert result["summary"]["확정위반"] == 0
    assert result["summary"]["의심"] == 0


# ========== 10. 타겟 기반 인코더 fit이 split 전이면 확정위반 ==========
def test_target_encoder_fit_before_split(analyzer):
    code = """
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler

# 타겟 기반 인코더(TargetEncoder 등) fit이 split 전
encoder = TargetEncoder()
encoder.fit(X, y)
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2)
X_train_enc = encoder.transform(X_train)
"""
    result = analyzer.analyze_code(code)
    assert result["classification"] == "확정위반"
    assert result["summary"]["확정위반"] >= 1


# ========== 11. 시계열 lag/shift 피처 생성 후 무작위 split이면 의심 ==========
def test_time_feature_gen_then_random_split(analyzer):
    code = """
import pandas as pd
from sklearn.model_selection import train_test_split

df = pd.read_csv('sales.csv')
df['date'] = pd.to_datetime(df['date'])
df['lag_1'] = df['sales'].shift(1)
df['lag_7'] = df['sales'].shift(7)
df = df.dropna()
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
"""
    result = analyzer.analyze_code(code)
    assert result["classification"] == "의심"
    assert result["summary"]["의심"] >= 1
