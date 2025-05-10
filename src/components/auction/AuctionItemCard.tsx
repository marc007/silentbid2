import { useState } from "react";
import { AuctionItem, createBid } from "../../lib/db";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import { useToast } from "../ui/use-toast";
import { useAuth } from "../../../supabase/auth";
import { formatDistanceToNow } from "date-fns";

interface AuctionItemCardProps {
  item: AuctionItem;
  onBidPlaced?: () => void;
}

export default function AuctionItemCard({
  item,
  onBidPlaced,
}: AuctionItemCardProps) {
  const [bidAmount, setBidAmount] = useState<string>(
    item.current_bid
      ? String(Number(item.current_bid) + 5)
      : String(Number(item.starting_bid) + 5),
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const currentBid = item.current_bid || item.starting_bid;
  const formattedCurrentBid = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(Number(currentBid));

  const handleBidSubmit = async () => {
    if (!user) {
      toast({
        title: "Not logged in",
        description: "You need to be logged in to place a bid",
        variant: "destructive",
      });
      return;
    }

    const bidAmountNum = Number(bidAmount);
    if (isNaN(bidAmountNum) || bidAmountNum <= Number(currentBid)) {
      toast({
        title: "Invalid bid",
        description: `Your bid must be higher than ${formattedCurrentBid}`,
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await createBid({
        item_id: item.id,
        user_id: user.id,
        amount: bidAmountNum,
      });

      toast({
        title: "Bid placed!",
        description: `You've successfully bid ${new Intl.NumberFormat("en-US", {
          style: "currency",
          currency: "USD",
        }).format(bidAmountNum)} on ${item.title}`,
      });

      setDialogOpen(false);
      if (onBidPlaced) onBidPlaced();
    } catch (error) {
      console.error("Error placing bid:", error);
      toast({
        title: "Bid failed",
        description:
          error instanceof Error ? error.message : "Failed to place bid",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="overflow-hidden h-full flex flex-col">
      {item.image_url && (
        <div className="aspect-video w-full overflow-hidden bg-gray-100">
          <img
            src={item.image_url}
            alt={item.title}
            className="w-full h-full object-cover"
          />
        </div>
      )}
      <CardHeader>
        <CardTitle className="line-clamp-2">{item.title}</CardTitle>
        <CardDescription>Current Bid: {formattedCurrentBid}</CardDescription>
      </CardHeader>
      <CardContent className="flex-grow">
        <p className="line-clamp-3 text-sm text-gray-600">{item.description}</p>
        {item.updated_at && (
          <p className="text-xs text-gray-500 mt-2">
            Last bid:{" "}
            {formatDistanceToNow(new Date(item.updated_at), {
              addSuffix: true,
            })}
          </p>
        )}
      </CardContent>
      <CardFooter>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="w-full">Place Bid</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Place a Bid</DialogTitle>
              <DialogDescription>
                Current bid is {formattedCurrentBid}. Your bid must be higher.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <Input
                type="number"
                step="0.01"
                min={Number(currentBid) + 0.01}
                value={bidAmount}
                onChange={(e) => setBidAmount(e.target.value)}
                placeholder="Enter bid amount"
              />
            </div>
            <DialogFooter>
              <Button onClick={handleBidSubmit} disabled={isSubmitting}>
                {isSubmitting ? "Placing Bid..." : "Confirm Bid"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardFooter>
    </Card>
  );
}
