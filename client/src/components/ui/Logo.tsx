import React from "react";

type LogoProps = {
  size?: "small" | "medium" | "large";
};

const Logo: React.FC<LogoProps> = ({ size = "medium" }) => {
  const sizes = {
    small: "w-8 h-8 text-lg",
    medium: "w-16 h-16 text-2xl",
    large: "w-20 h-20 text-3xl",
  };

  return (
    <div className={`inline-flex items-center justify-center ${sizes[size]} bg-primary rounded-full shadow-lg mb-4`}>
      <i className="fas fa-comments text-white"></i>
    </div>
  );
};

export default Logo;
