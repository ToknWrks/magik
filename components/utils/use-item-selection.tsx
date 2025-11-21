'use client'

import { useState } from 'react'
import { useSelectedItems } from '@/app/selected-items-context'

export const useItemSelection = (items: any[]) => {
  const { selectedItems, setSelectedItems } = useSelectedItems()
  const [isAllSelected, setIsAllSelected] = useState<boolean>(false)

  // Ensure handleCheckboxChange only affects the specific item
  const handleCheckboxChange = (id: string | number, checked: boolean) => {
    const idNum = Number(id);
    if (checked) {
      setSelectedItems([...selectedItems, idNum]);
    } else {
      setSelectedItems(selectedItems.filter((itemId) => itemId !== idNum));
    }
  };

  const handleSelectAllChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setIsAllSelected(e.target.checked);
    if (e.target.checked) {
      setSelectedItems(items.map((item) => Number(item.id)));
    } else {
      setSelectedItems([]);
    }
  };

  return {
    selectedItems,
    isAllSelected,
    handleCheckboxChange,
    handleSelectAllChange,
  }
}
