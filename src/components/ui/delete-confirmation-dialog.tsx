"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { AlertTriangle } from "lucide-react"

interface DeleteConfirmationDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  description: string
  confirmationText: string
  itemName: string
  isLoading?: boolean
}

export function DeleteConfirmationDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmationText,
  itemName,
  isLoading = false
}: DeleteConfirmationDialogProps) {
  const [inputValue, setInputValue] = useState("")
  
  const isConfirmationValid = inputValue === confirmationText
  
  const handleConfirm = () => {
    if (isConfirmationValid) {
      onConfirm()
      setInputValue("")
    }
  }
  
  const handleClose = () => {
    setInputValue("")
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/20">
              <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-500" />
            </div>
            <div>
              <DialogTitle className="text-lg font-semibold">{title}</DialogTitle>
            </div>
          </div>
          <DialogDescription className="mt-3 text-sm text-muted-foreground">
            {description}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-md border border-red-200 dark:border-red-800">
            <p className="text-sm font-medium text-red-800 dark:text-red-200">
              {itemName}
            </p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="confirmation-input" className="text-sm font-medium">
              Type <strong className="font-mono bg-muted px-1 rounded">{confirmationText}</strong> to confirm:
            </Label>
            <Input
              id="confirmation-input"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder={`Type "${confirmationText}" here...`}
              className="font-mono"
              disabled={isLoading}
            />
          </div>
        </div>

        <DialogFooter className="flex gap-3">
          <Button variant="outline" onClick={handleClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={!isConfirmationValid || isLoading}
          >
            {isLoading ? "Deleting..." : "Delete Forever"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}