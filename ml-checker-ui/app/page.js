"use client";

import { useState, useRef, useEffect } from "react";
import styles from "./page.module.css";
import Onboarding from "./components/Onboarding";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "";
...