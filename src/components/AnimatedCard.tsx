import { motion } from "framer-motion";
import { Card } from "./ui/card";
import { ReactNode } from "react";

interface AnimatedCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

export function AnimatedCard({ children, className, ...props }: AnimatedCardProps) {
  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -2 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="h-full"
    >
      <Card
        className={`transition-all duration-300 ease-in-out hover:shadow-xl cursor-pointer ${className}`}
        {...props}
      >
        {children}
      </Card>
    </motion.div>
  );
}