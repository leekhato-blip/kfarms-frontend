import rootsLogo from "../assets/roots-logo-trimmed.png";
import BrandedLoader from "./BrandedLoader";

export default function PlatformLoader({ label = "Loading ROOTS platform..." }) {
  return (
    <BrandedLoader
      variant="platform"
      logoSrc={rootsLogo}
      logoAlt="ROOTS"
      label={label}
    />
  );
}
