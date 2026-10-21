import React from 'react';
import { AppColors } from '../theme/appColors';

export const KohiMascotIcon: React.FC<{ size?: number; className?: string }> = ({
  size = 40,
  className = '',
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="Kōhī Coffee Bean Mascot"
    >
      {/* App Icon Rounded Background in Milk Cream */}
      <rect
        x="2"
        y="2"
        width="60"
        height="60"
        rx="16"
        fill={AppColors.milkCream}
        stroke={AppColors.caramel}
        strokeWidth="2"
      />
      {/* Warm Steam Wisps */}
      <path
        d="M25 14C25 11.5 27 10.5 27 8"
        stroke={AppColors.caramel}
        strokeWidth="2.2"
        strokeLinecap="round"
      />
      <path
        d="M39 14C39 11.5 41 10.5 41 8"
        stroke={AppColors.caramel}
        strokeWidth="2.2"
        strokeLinecap="round"
      />
      {/* Coffee Bean Mascot Body in Espresso */}
      <ellipse
        cx="32"
        cy="35"
        rx="18"
        ry="19"
        fill={AppColors.espresso}
        stroke={AppColors.darkRoast}
        strokeWidth="2"
      />
      {/* Cozy Milk Cream Robe / Collar */}
      <path
        d="M16 42C20 47 26 49 32 49C38 49 44 47 48 42C46 50 39.5 54 32 54C24.5 54 18 50 16 42Z"
        fill={AppColors.milkCream}
        stroke={AppColors.darkRoast}
        strokeWidth="1.8"
      />
      {/* Signature Coffee Bean Groove in Caramel */}
      <path
        d="M32 17C29.5 23 34.5 29 32 36"
        stroke={AppColors.caramel}
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      {/* Friendly Eyes & Smile */}
      <circle cx="25" cy="33" r="2.2" fill={AppColors.milkCream} />
      <circle cx="39" cy="33" r="2.2" fill={AppColors.milkCream} />
      <path
        d="M28.5 38C29.7 39.6 34.3 39.6 35.5 38"
        stroke={AppColors.milkCream}
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
};
