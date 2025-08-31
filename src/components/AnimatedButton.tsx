import { motion } from "framer-motion";
import { Button, ButtonProps } from "./ui/button";
import { ReactNode } from "react";

interface AnimatedButtonProps extends ButtonProps {
  children: ReactNode;
}

export function AnimatedButton({ children, className, ...props }: AnimatedButtonProps) {
  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      transition={{ duration: 0.2, ease: "easeInOut" }}
    >
      <Button
        className={`transition-all duration-300 ease-in-out hover:shadow-lg ${className}`}
        {...props}
      >
        {children}
      </Button>
    </motion.div>
  );
}