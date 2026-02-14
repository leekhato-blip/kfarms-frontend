import React from "react";
import { motion } from "framer-motion";


/**
 * PageWrapper adds smooth fade-in animation to any page.
 */
export default function PageWrapper({ children }) {
    return (
        <motion.div
            initial={{ opacity: 1, y: 0 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
        >
            {children}
        </motion.div>
    );
}