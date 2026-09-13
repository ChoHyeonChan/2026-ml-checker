"use client";

import { useState } from "react";
import styles from "./page.module.css";
import Onboarding from "./components/Onboarding";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "";

const CHARACTER_MAP = {
  확정위반: "/character-fail-v3.jpg",
  의심: "/character-attention-v3.jpg",
  이상없음: "/character-pass-v3.jpg",
};

const BANNER_MAP = {
  통과: "/character-pass-v3.jpg",
  안내필요: "/character-attention-v3.jpg",
};
