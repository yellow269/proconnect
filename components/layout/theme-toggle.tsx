"use client";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
export function ThemeToggle() { const { resolvedTheme, setTheme } = useTheme(); return <Button variant="ghost" className="h-10 w-10 px-0" onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")} aria-label="Toggle theme"><Sun className="hidden h-4 w-4 dark:block"/><Moon className="h-4 w-4 dark:hidden"/></Button>; }
