import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import {
  getAuctionById,
  getAuctionItems,
  Auction,
  AuctionItem,
} from "../../lib/db";
import { LoadingSpinner } from "../ui/loading-spinner";
import AuctionItemCard from "../auction/AuctionItemCard";
import { format } from "date-fns";

export default function AuctionPage() {
  const { id } = useParams<{ id: string }>();
  const [auction, setAuction] = useState<Auction | null>(null);
  const [items, setItems] = useState<AuctionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadAuctionData() {
      if (!id) return;

      try {
        setLoading(true);
        const [auctionData, itemsData] = await Promise.all([
          getAuctionById(id),
          getAuctionItems(id),
        ]);

        setAuction(auctionData);
        setItems(itemsData);
      } catch (err) {
        console.error("Error loading auction data:", err);
        setError("Failed to load auction information. Please try again later.");
      } finally {
        setLoading(false);
      }
    }

    loadAuctionData();
  }, [id]);

  const refreshItems = async () => {
    if (!id) return;
    try {
      const itemsData = await getAuctionItems(id);
      setItems(itemsData);
    } catch (err) {
      console.error("Error refreshing items:", err);
    }
  };

  if (loading) {
    return <LoadingSpinner text="Loading auction..." />;
  }

  if (error || !auction) {
    return (
      <div className="p-4 bg-red-50 text-red-800 rounded-md">
        <p>{error || "Auction not found"}</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">{auction.title}</h1>
        <p className="text-gray-600 mb-4">{auction.description}</p>
        <div className="flex flex-wrap gap-4 text-sm">
          <div className="bg-blue-50 text-blue-800 px-3 py-1 rounded-full">
            Starts: {format(new Date(auction.start_time), "PPP 'at' p")}
          </div>
          <div className="bg-red-50 text-red-800 px-3 py-1 rounded-full">
            Ends: {format(new Date(auction.end_time), "PPP 'at' p")}
          </div>
        </div>
      </div>

      <h2 className="text-2xl font-semibold mb-4">Auction Items</h2>

      {items.length === 0 ? (
        <div className="text-center p-8 bg-gray-50 rounded-lg">
          <p className="text-gray-500">
            No items available in this auction yet.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((item) => (
            <AuctionItemCard
              key={item.id}
              item={item}
              onBidPlaced={refreshItems}
            />
          ))}
        </div>
      )}
    </div>
  );
}
