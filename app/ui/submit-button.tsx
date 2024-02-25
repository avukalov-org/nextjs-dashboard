"use client"

import { useFormStatus } from "react-dom";
import { Button } from "./button";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
}

export function SubmitButton({ children }: ButtonProps) {
  const { pending } = useFormStatus();
  return (
    <Button aria-disabled={pending} >
      {children}
    </Button>
  );
}