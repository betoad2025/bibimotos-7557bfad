import { useParams } from "react-router-dom";
import CityLanding from "./CityLanding";

export default function CityLandingWrapper() {
  const { subdomain } = useParams<{ subdomain: string }>();
  return <CityLanding subdomainOverride={subdomain} />;
}
