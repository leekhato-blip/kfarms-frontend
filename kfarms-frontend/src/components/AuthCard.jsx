import React from "react";


/**
 * AuthCard is a centered card with header slot.
 */
export default function AuthCard({ title, subtitle, children }) {
    return (
        <div className="w-full max-w-md mx-auto bg-darkCard glass shadow-dark rounded-lg p-8">
            {title && <h2 className="font-header tracking-tight text-h2 text-accent-primary mb-2">{title}</h2>}
            {subtitle && <p className="font-body text-base text-darkText mb-6">{subtitle}</p>}
            <div>{children}</div>
        </div>
    );
}