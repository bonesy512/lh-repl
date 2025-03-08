import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { GeneratePrice } from "./GeneratePrice";
import { useAppStore } from "@/utils/store";
import type { PropertyDetailsResponse } from "types";

interface AnalysisDialogProps {
  isOpen: boolean;
  onClose: () => void;
  property: PropertyDetailsResponse | null;
}

export function AnalysisDialog({
  isOpen,
  onClose,
  property,
}: AnalysisDialogProps) {
  const { removeRunningProperty } = useAppStore();

  // Handle analysis completion
  const handleAnalysisComplete = () => {
    try {
      if (property?.address?.streetAddress) {
        removeRunningProperty(property.address.streetAddress);
      }
    } catch (error) {
      console.error("Error in handleAnalysisComplete:", error);
    }
  };

  if (!property) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) {
        handleAnalysisComplete();
        onClose();
      }
    }}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Property Analysis</DialogTitle>
        </DialogHeader>

        <GeneratePrice
          selectedProperty={property}
          onAnalysisComplete={handleAnalysisComplete}
        />
      </DialogContent>
    </Dialog>
  );
}