'use client';

import { useState } from 'react';
import { Button } from '@/shared/components/ui/button';
import { Badge } from '@/shared/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/shared/components/ui/alert-dialog';
import { Pencil, Trash2, Plus, ToggleLeft, ToggleRight } from 'lucide-react';
import type { CoreValue } from '../types';

interface CoreValueListProps {
  coreValues: CoreValue[];
  onEdit: (coreValue: CoreValue) => void;
  onDelete: (id: string) => Promise<void>;
  onToggleActive: (id: string, isActive: boolean) => Promise<void>;
  onCreate: () => void;
  isLoading?: boolean;
}

export function CoreValueList({
  coreValues,
  onEdit,
  onDelete,
  onToggleActive,
  onCreate,
  isLoading = false,
}: CoreValueListProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      await onDelete(id);
    } finally {
      setDeletingId(null);
    }
  };

  if (coreValues.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-slate-300 p-12">
        <p className="mb-4 text-slate-500">No core values defined yet.</p>
        <Button onClick={onCreate} className="bg-[#1e3a5f] hover:bg-[#2d4a6f]">
          <Plus className="mr-2 h-4 w-4" />
          Add Core Value
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={onCreate} className="bg-[#1e3a5f] hover:bg-[#2d4a6f]">
          <Plus className="mr-2 h-4 w-4" />
          Add Core Value
        </Button>
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50">
              <TableHead className="w-16">Order</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Description</TableHead>
              <TableHead className="w-24">Status</TableHead>
              <TableHead className="w-32 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {coreValues.map((cv) => (
              <TableRow key={cv.id}>
                <TableCell className="font-medium">{cv.displayOrder}</TableCell>
                <TableCell>
                  <div>
                    <p className="font-medium text-[#1e3a5f]">{cv.name}</p>
                    {cv.nameTh && (
                      <p className="text-sm text-slate-500">{cv.nameTh}</p>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <p className="max-w-md truncate text-slate-600">
                    {cv.description}
                  </p>
                </TableCell>
                <TableCell>
                  <Badge
                    variant={cv.isActive ? 'default' : 'secondary'}
                    className={
                      cv.isActive
                        ? 'bg-green-100 text-green-800 hover:bg-green-100'
                        : 'bg-slate-100 text-slate-600'
                    }
                  >
                    {cv.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onToggleActive(cv.id, !cv.isActive)}
                      title={cv.isActive ? 'Deactivate' : 'Activate'}
                      disabled={isLoading}
                    >
                      {cv.isActive ? (
                        <ToggleRight className="h-4 w-4 text-green-600" />
                      ) : (
                        <ToggleLeft className="h-4 w-4 text-slate-400" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onEdit(cv)}
                      disabled={isLoading}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={isLoading || deletingId === cv.id}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Core Value</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete &quot;{cv.name}&quot;? This
                            action cannot be undone. Existing evaluations using this
                            value will retain their data.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDelete(cv.id)}
                            className="bg-red-500 hover:bg-red-600"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
