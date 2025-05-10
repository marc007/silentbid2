import { useEffect, useState } from "react";
import { getAuctions, Auction } from "../../lib/db";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Button } from "../ui/button";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";
import { LoadingSpinner } from "../ui/loading-spinner";

export default function AuctionList() {
  const [auctions, setAuctions] = useState<Auction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    async function loadAuctions() {
      try {
        const data = await getAuctions();
        setAuctions(data);
      } catch (err) {
        console.error("Error loading auctions:", err);
        setError("Failed to load auctions. Please try again later.");
      } finally {
        setLoading(false);
      }
    }

    loadAuctions();
  }, []);

  if (loading) {
    return <LoadingSpinner text="Loading auctions..." />;
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 text-red-800 rounded-md">
        <p>{error}</p>
        <Button
          variant="outline"
          className="mt-2"
          onClick={() => window.location.reload()}
        >
          Retry
        </Button>
      </div>
    );
  }

  if (auctions.length === 0) {
    return (
      <div className="text-center p-8">
        <h2 className="text-2xl font-bold mb-2">No Auctions Available</h2>
        <p className="text-gray-500 mb-4">
          Check back later for upcoming auctions.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-4">
      {auctions.map((auction) => (
        <Card
          key={auction.id}
          className="overflow-hidden hover:shadow-lg transition-shadow"
        >
          <CardHeader className="bg-gray-50">
            <CardTitle>{auction.title}</CardTitle>
            <CardDescription>
              {format(new Date(auction.start_time), "PPP")} -{" "}
              {format(new Date(auction.end_time), "PPP")}
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            <p className="line-clamp-3">{auction.description}</p>
          </CardContent>
          <CardFooter>
            <Button
              className="w-full"
              onClick={() => navigate(`/auction/${auction.id}`)}
            >
              View Auction
            </Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}
