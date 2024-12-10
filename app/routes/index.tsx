import { Link } from "react-router";

export default function Homepage() {
  return (
    <div className="h-full">
      <div className="container max-w-lg mx-auto p-8">
        <h2 className="text-3xl mb-4">Carniceria El Tori</h2>
        <Link to="/dashboard">Visit the dashboard &rarr;</Link>
      </div>
    </div>
  );
}
