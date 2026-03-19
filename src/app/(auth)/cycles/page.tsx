"use client";

/**
 * Cycles Page
 *
 * Review cycle management page for HR administrators.
 */

import React, { useState } from "react";
import { useCycles } from "@/features/cycles/hooks/use-cycles";
import { CycleList } from "@/features/cycles/components/cycle-list";
import { CycleForm } from "@/features/cycles/components/cycle-form";
import { CreateCycleRequest, ReviewCycleListItem } from "@/features/cycles/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/shared/components/ui/alert-dialog";
import { toast } from "sonner";

export default function CyclesPage() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedCycle, setSelectedCycle] = useState<ReviewCycleListItem | null>(null);
  const [activateConfirmCycle, setActivateConfirmCycle] = useState<ReviewCycleListItem | null>(null);
  const [closeConfirmCycle, setCloseConfirmCycle] = useState<ReviewCycleListItem | null>(null);

  const {
    cycles,
    isLoading,
    error,
    refetch,
    createCycle,
    updateCycle,
    activateCycle,
    closeCycle,
    deleteCycle,
  } = useCycles();

  const handleCreateCycle = async (data: CreateCycleRequest) => {
    try {
      await createCycle(data);
      setIsCreateDialogOpen(false);
      toast.success("Review cycle created successfully");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create cycle");
      throw err;
    }
  };

  const handleEditCycle = async (data: CreateCycleRequest) => {
    if (!selectedCycle) return;

    try {
      await updateCycle(selectedCycle.id, data);
      setIsEditDialogOpen(false);
      setSelectedCycle(null);
      toast.success("Review cycle updated successfully");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update cycle");
      throw err;
    }
  };

  const handleActivateCycle = async () => {
    if (!activateConfirmCycle) return;

    try {
      await activateCycle(activateConfirmCycle.id);
      setActivateConfirmCycle(null);
      toast.success("Review cycle activated successfully");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to activate cycle");
    }
  };

  const handleCloseCycle = async () => {
    if (!closeConfirmCycle) return;

    try {
      await closeCycle(closeConfirmCycle.id);
      setCloseConfirmCycle(null);
      toast.success("Review cycle closed successfully");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to close cycle");
    }
  };

  const handleViewCycle = (cycle: ReviewCycleListItem) => {
    // Navigate to cycle detail page (to be implemented)
    console.log("View cycle:", cycle.id);
  };

  if (error) {
    return (
      <div className="container mx-auto py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">Error loading cycles: {error}</p>
          <button
            onClick={refetch}
            className="mt-2 text-sm text-red-600 underline"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-navy-900">Review Cycles</h1>
        <p className="text-slate-600 mt-1">
          Create and manage performance review cycles for your organization.
        </p>
      </div>

      <CycleList
        cycles={cycles}
        isLoading={isLoading}
        onCreateCycle={() => setIsCreateDialogOpen(true)}
        onEditCycle={(cycle) => {
          setSelectedCycle(cycle);
          setIsEditDialogOpen(true);
        }}
        onActivateCycle={(cycle) => setActivateConfirmCycle(cycle)}
        onCloseCycle={(cycle) => setCloseConfirmCycle(cycle)}
        onViewCycle={handleViewCycle}
      />

      {/* Create Cycle Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-navy-900">Create Review Cycle</DialogTitle>
          </DialogHeader>
          <CycleForm
            mode="create"
            onSubmit={handleCreateCycle}
            onCancel={() => setIsCreateDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Cycle Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-navy-900">Edit Review Cycle</DialogTitle>
          </DialogHeader>
          {selectedCycle && (
            <CycleForm
              mode="edit"
              initialData={{
                name: selectedCycle.name,
                type: selectedCycle.type,
                startDate: selectedCycle.startDate,
                endDate: selectedCycle.endDate,
                selfEvalDeadline: selectedCycle.selfEvalDeadline,
                managerReviewDeadline: selectedCycle.managerReviewDeadline,
              }}
              onSubmit={handleEditCycle}
              onCancel={() => {
                setIsEditDialogOpen(false);
                setSelectedCycle(null);
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Activate Confirmation Dialog */}
      <AlertDialog
        open={!!activateConfirmCycle}
        onOpenChange={() => setActivateConfirmCycle(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Activate Review Cycle</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to activate &quot;{activateConfirmCycle?.name}&quot;?
              This will make it the current active review cycle and allow employees to
              begin their self-evaluations.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleActivateCycle}
              className="bg-green-600 hover:bg-green-700"
            >
              Activate
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Close Confirmation Dialog */}
      <AlertDialog
        open={!!closeConfirmCycle}
        onOpenChange={() => setCloseConfirmCycle(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Close Review Cycle</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to close &quot;{closeConfirmCycle?.name}&quot;?
              This will finalize all evaluations and prevent any further changes.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCloseCycle}
              className="bg-red-600 hover:bg-red-700"
            >
              Close Cycle
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
