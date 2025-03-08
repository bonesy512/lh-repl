import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { GeneratePrice } from "./GeneratePrice";
import { useAppStore } from "@/utils/store";
import type { PropertyDetailsResponse } from "types";

interface AnalysisDialogProps {
  isOpen: boolean;
  onClose: () => void;
  property: PropertyDetailsResponse | null;
}

export function AnalysisDialog({ isOpen, onClose, property }: AnalysisDialogProps) {
  const { removeRunningProperty } = useAppStore();

  // Handle analysis completion
  const handleAnalysisComplete = () => {
    if (property?.address?.streetAddress) {
      removeRunningProperty(property.address.streetAddress);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Property Analysis</DialogTitle>
        </DialogHeader>

        {property && (
          <GeneratePrice 
            selectedProperty={property}
            onAnalysisComplete={handleAnalysisComplete}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}