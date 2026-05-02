function toNumber(value, fallback = 0) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
}

function normalizeDate(value, fallback = null) {
  if (!value) return fallback;
  if (typeof value === "string") return value;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return fallback;
  return parsed.toISOString();
}

function todayDateOnly() {
  return new Date().toISOString().slice(0, 10);
}

function sameDay(left, right) {
  if (!left || !right) return false;
  return String(left).slice(0, 10) === String(right).slice(0, 10);
}

function sameMonth(left, right) {
  if (!left || !right) return false;
  return String(left).slice(0, 7) === String(right).slice(0, 7);
}

function createBaseRecord(partial, requestId, now) {
  return {
    ...partial,
    offlinePending: true,
    offlineStatus: "queued",
    offlineRequestId: requestId,
    offlineQueuedAt: now,
  };
}

function resolveItemArray(payload) {
  if (!payload || typeof payload !== "object") return null;
  if (Array.isArray(payload.items)) {
    return {
      items: payload.items,
      setItems(next) {
        payload.items = next;
      },
      payload,
    };
  }
  if (Array.isArray(payload.content)) {
    return {
      items: payload.content,
      setItems(next) {
        payload.content = next;
      },
      payload,
    };
  }
  if (Array.isArray(payload.records)) {
    return {
      items: payload.records,
      setItems(next) {
        payload.records = next;
      },
      payload,
    };
  }
  if (Array.isArray(payload)) {
    return {
      items: payload,
      setItems(next) {
        payload.length = 0;
        payload.push(...next);
      },
      payload: null,
    };
  }
  return null;
}

function normalizeMatchKey(record) {
  return String(record?.id ?? record?.offlineRequestId ?? "");
}

function mergeIntoList(items, record, { prepend = false } = {}) {
  const nextItems = Array.isArray(items) ? [...items] : [];
  const matchKey = normalizeMatchKey(record);
  const index = nextItems.findIndex((item) => {
    const itemKey = normalizeMatchKey(item);
    return itemKey && itemKey === matchKey;
  });

  if (index >= 0) {
    nextItems[index] = {
      ...nextItems[index],
      ...record,
    };
    return nextItems;
  }

  if (prepend) {
    nextItems.unshift(record);
    return nextItems;
  }

  nextItems.push(record);
  return nextItems;
}

function removeFromList(items, record) {
  const matchKey = normalizeMatchKey(record);
  if (!matchKey) return Array.isArray(items) ? [...items] : [];
  return (Array.isArray(items) ? items : []).filter((item) => normalizeMatchKey(item) !== matchKey);
}

function patchPaginatedResponse(responseData, record, { prepend = false } = {}) {
  if (!responseData || typeof responseData !== "object") return responseData;
  const payload = responseData.data;
  const resolved = resolveItemArray(payload);
  if (!resolved) return responseData;

  const nextItems = mergeIntoList(resolved.items, record, { prepend });
  resolved.setItems(nextItems);

  if (resolved.payload && typeof resolved.payload.totalItems === "number" && prepend) {
    const alreadyCounted = resolved.items.some(
      (item) => item !== record && normalizeMatchKey(item) === normalizeMatchKey(record),
    );
    if (!alreadyCounted) {
      resolved.payload.totalItems += 1;
    }
  }

  return responseData;
}

function patchSingleResponse(responseData, record) {
  if (!responseData || typeof responseData !== "object") return responseData;
  if (!responseData.data || typeof responseData.data !== "object") return responseData;
  responseData.data = {
    ...responseData.data,
    ...record,
  };
  return responseData;
}

function compareDateValues(left, right) {
  const leftTime = left ? new Date(left).getTime() : Number.POSITIVE_INFINITY;
  const rightTime = right ? new Date(right).getTime() : Number.POSITIVE_INFINITY;
  if (leftTime === rightTime) return 0;
  return leftTime - rightTime;
}

function compareTextValues(left, right) {
  return String(left || "").localeCompare(String(right || ""));
}

function sortTasks(items) {
  return [...items].sort((left, right) => {
    const dueComparison = compareDateValues(left?.dueDate, right?.dueDate);
    if (dueComparison !== 0) return dueComparison;

    const priorityComparison = toNumber(left?.priority, 3) - toNumber(right?.priority, 3);
    if (priorityComparison !== 0) return priorityComparison;

    return compareTextValues(left?.title, right?.title);
  });
}

function isTaskHidden(task) {
  if (!task || typeof task !== "object") return false;
  if (task.deleted || task.deletedAt) return true;
  if (task.completed || task.completedAt) return true;
  return String(task.status || "").trim().toUpperCase() === "COMPLETED";
}

function updateCollectionTotal(resolved, currentItems, nextItems) {
  if (!resolved?.payload || typeof resolved.payload.totalItems !== "number") return;
  resolved.payload.totalItems += nextItems.length - currentItems.length;
  if (resolved.payload.totalItems < 0) {
    resolved.payload.totalItems = 0;
  }
}

function defaultCreateRecord(resource, payload, requestId, now) {
  return createBaseRecord(
    {
      id: `offline-${resource}-${requestId}`,
      ...payload,
    },
    requestId,
    now,
  );
}

function buildSalesRecord(payload, requestId, now, baseRecord = null) {
  const quantity = toNumber(payload?.quantity, toNumber(baseRecord?.quantity));
  const unitPrice = toNumber(payload?.unitPrice, toNumber(baseRecord?.unitPrice));
  return createBaseRecord(
    {
      ...(baseRecord || {}),
      id: baseRecord?.id || `offline-sales-${requestId}`,
      itemName: payload?.itemName ?? baseRecord?.itemName ?? "",
      category: payload?.category ?? baseRecord?.category ?? "OTHER",
      quantity,
      unitPrice,
      totalPrice: quantity * unitPrice,
      buyer: payload?.buyer ?? baseRecord?.buyer ?? null,
      note: payload?.note ?? baseRecord?.note ?? null,
      salesDate: payload?.salesDate ?? baseRecord?.salesDate ?? now,
      updatedAt: now,
    },
    requestId,
    now,
  );
}

function patchSalesSummary(responseData, mutation) {
  const summary = responseData?.data;
  const record = mutation.optimisticData;
  if (!summary || !record) return responseData;

  const total = toNumber(record?.totalPrice);
  const today = todayDateOnly();
  const saleDate = record?.salesDate || today;

  if (mutation.action === "create") {
    summary.totalSalesRecords = toNumber(summary.totalSalesRecords) + 1;
    summary.totalRevenue = toNumber(summary.totalRevenue) + total;
    if (sameDay(saleDate, today)) {
      summary.revenueToday = toNumber(summary.revenueToday) + total;
    }
    if (sameMonth(saleDate, today)) {
      summary.revenueThisMonth = toNumber(summary.revenueThisMonth) + total;
    }
  }

  return responseData;
}

function buildSuppliesRecord(payload, requestId, now, baseRecord = null) {
  const quantity = toNumber(payload?.quantity, toNumber(baseRecord?.quantity));
  const unitPrice = toNumber(payload?.unitPrice, toNumber(baseRecord?.unitPrice));
  return createBaseRecord(
    {
      ...(baseRecord || {}),
      id: baseRecord?.id || `offline-supplies-${requestId}`,
      itemName: payload?.itemName ?? baseRecord?.itemName ?? "",
      category: payload?.category ?? baseRecord?.category ?? "OTHER",
      quantity,
      unitPrice,
      totalPrice: quantity * unitPrice,
      supplierName: payload?.supplierName ?? baseRecord?.supplierName ?? null,
      note: payload?.note ?? baseRecord?.note ?? null,
      supplyDate: payload?.supplyDate ?? baseRecord?.supplyDate ?? now,
      updatedAt: now,
    },
    requestId,
    now,
  );
}

function patchSuppliesSummary(responseData, mutation) {
  const summary = responseData?.data;
  const record = mutation.optimisticData;
  if (!summary || !record) return responseData;

  const total = toNumber(record?.totalPrice);
  const today = todayDateOnly();
  const supplyDate = record?.supplyDate || today;

  if (mutation.action === "create") {
    summary.totalSupplies = toNumber(summary.totalSupplies) + 1;
    summary.records = toNumber(summary.records) + 1;
    summary.totalAmountSpent = toNumber(summary.totalAmountSpent) + total;
    summary.totalCost = toNumber(summary.totalCost) + total;
    if (sameDay(supplyDate, today)) {
      summary.spentToday = toNumber(summary.spentToday) + total;
      summary.totalAmountSpentToday = toNumber(summary.totalAmountSpentToday) + total;
    }
    if (sameMonth(supplyDate, today)) {
      summary.spentThisMonth = toNumber(summary.spentThisMonth) + total;
      summary.totalAmountSpentThisMonth = toNumber(summary.totalAmountSpentThisMonth) + total;
    }
  }

  return responseData;
}

function buildInventoryRecord(payload, requestId, now, baseRecord = null) {
  const quantity = toNumber(payload?.quantity, toNumber(baseRecord?.quantity));
  const unitCost = payload?.unitCost == null ? null : toNumber(payload?.unitCost, 0);
  const minThreshold = toNumber(payload?.minThreshold, toNumber(baseRecord?.minThreshold));
  return createBaseRecord(
    {
      ...(baseRecord || {}),
      id: baseRecord?.id || `offline-inventory-${requestId}`,
      itemName: payload?.itemName ?? baseRecord?.itemName ?? baseRecord?.name ?? "",
      category: payload?.category ?? baseRecord?.category ?? "OTHER",
      sku: payload?.sku ?? baseRecord?.sku ?? null,
      quantity,
      minThreshold,
      unit: payload?.unit ?? baseRecord?.unit ?? "units",
      unitCost,
      totalValue: quantity * toNumber(unitCost, 0),
      supplierName: payload?.supplierName ?? baseRecord?.supplierName ?? null,
      storageLocation: payload?.storageLocation ?? baseRecord?.storageLocation ?? null,
      note: payload?.note ?? baseRecord?.note ?? null,
      lastUpdated: payload?.lastUpdated ?? baseRecord?.lastUpdated ?? todayDateOnly(),
      updatedAt: now,
    },
    requestId,
    now,
  );
}

function patchInventorySummary(responseData, mutation) {
  const summary = responseData?.data;
  const record = mutation.optimisticData;
  if (!summary || !record) return responseData;

  if (mutation.action === "create") {
    summary.totalInventoryItems = toNumber(summary.totalInventoryItems) + 1;
    summary.totalQuantity = toNumber(summary.totalQuantity) + toNumber(record.quantity);
    summary.inventoryValue = toNumber(summary.inventoryValue) + toNumber(record.totalValue);
  }

  summary.lastUpdated = record.lastUpdated || todayDateOnly();
  return responseData;
}

function buildEggRecord(payload, requestId, now, baseRecord = null, context = null) {
  const goodEggs = toNumber(payload?.goodEggs, toNumber(baseRecord?.goodEggs));
  const damagedEggs = toNumber(payload?.damagedEggs, toNumber(baseRecord?.damagedEggs));
  return createBaseRecord(
    {
      ...(baseRecord || {}),
      id: baseRecord?.id || `offline-eggs-${requestId}`,
      batchId: payload?.batchId ?? baseRecord?.batchId ?? null,
      batchName: context?.batchName ?? baseRecord?.batchName ?? `Batch #${payload?.batchId || ""}`.trim(),
      collectionDate: payload?.collectionDate ?? baseRecord?.collectionDate ?? todayDateOnly(),
      goodEggs,
      damagedEggs,
      totalEggs: goodEggs + damagedEggs,
      cratesProduced: Math.floor(goodEggs / 30),
      note: payload?.note ?? baseRecord?.note ?? null,
      createdAt: now,
      updatedAt: now,
    },
    requestId,
    now,
  );
}

function patchEggSummary(responseData, mutation) {
  const summary = responseData?.data;
  const record = mutation.optimisticData;
  if (!summary || !record || mutation.action !== "create") return responseData;

  const collectionDate = record.collectionDate || todayDateOnly();
  const today = todayDateOnly();
  const monthKey = String(collectionDate).slice(0, 7);

  summary.totalRecords = toNumber(summary.totalRecords) + 1;
  summary.totalGoodEggs = toNumber(summary.totalGoodEggs) + toNumber(record.goodEggs);
  summary.totalCracked = toNumber(summary.totalCracked) + toNumber(record.damagedEggs);
  summary.totalCratesProduced =
    toNumber(summary.totalCratesProduced) + toNumber(record.cratesProduced);

  if (sameDay(collectionDate, today)) {
    summary.todayGoodEggs = toNumber(summary.todayGoodEggs) + toNumber(record.goodEggs);
    summary.todayCracked = toNumber(summary.todayCracked) + toNumber(record.damagedEggs);
    summary.todayCratesProduced =
      toNumber(summary.todayCratesProduced) + toNumber(record.cratesProduced);
  }

  if (sameMonth(collectionDate, today)) {
    summary.monthlyGoodEggs = toNumber(summary.monthlyGoodEggs) + toNumber(record.goodEggs);
    summary.monthlyCracked = toNumber(summary.monthlyCracked) + toNumber(record.damagedEggs);
    summary.monthlyCratesProduced =
      toNumber(summary.monthlyCratesProduced) + toNumber(record.cratesProduced);
  }

  summary.lastCollectionDate = collectionDate;
  summary.countByBatch = {
    ...(summary.countByBatch || {}),
    [record.batchName || "Unknown batch"]:
      toNumber(summary?.countByBatch?.[record.batchName || "Unknown batch"]) +
      toNumber(record.goodEggs),
  };
  summary.monthlyProduction = {
    ...(summary.monthlyProduction || {}),
    [monthKey]:
      toNumber(summary?.monthlyProduction?.[monthKey]) + toNumber(record.goodEggs),
  };

  return responseData;
}

function buildFishPondMortalityRecord(payload, requestId, now, baseRecord = null) {
  const count = toNumber(payload?.count);
  const mortalityDate = payload?.mortalityDate ?? todayDateOnly();
  const currentStock = Math.max(toNumber(baseRecord?.currentStock) - count, 0);
  return createBaseRecord(
    {
      ...(baseRecord || {}),
      id: baseRecord?.id || `offline-fishpond-mortality-${requestId}`,
      currentStock,
      mortalityCount: toNumber(baseRecord?.mortalityCount) + count,
      mortalityThisWeek: toNumber(baseRecord?.mortalityThisWeek) + count,
      mortalityThisMonth: toNumber(baseRecord?.mortalityThisMonth) + count,
      lastMortalityDate: mortalityDate,
      status:
        currentStock === 0 && String(baseRecord?.status || "").toUpperCase() === "ACTIVE"
          ? "EMPTY"
          : baseRecord?.status ?? "ACTIVE",
      note: payload?.note ?? baseRecord?.note ?? null,
      updatedAt: now,
    },
    requestId,
    now,
  );
}

function patchFishPondSummary(responseData, mutation) {
  const summary = responseData?.data;
  const record = mutation?.optimisticData;
  if (!summary || !record) return responseData;

  if (mutation.action === "create") {
    summary.totalFishPonds = toNumber(summary.totalFishPonds) + 1;
    summary.totalFishes = toNumber(summary.totalFishes) + toNumber(record.currentStock);
    summary.totalQuantity = toNumber(summary.totalQuantity) + toNumber(record.capacity);
    summary.countByStatus = {
      ...(summary.countByStatus || {}),
      [record.status || "ACTIVE"]: toNumber(summary?.countByStatus?.[record.status || "ACTIVE"]) + 1,
    };
    summary.countByPondType = {
      ...(summary.countByPondType || {}),
      [record.pondType || "GROW_OUT"]: toNumber(summary?.countByPondType?.[record.pondType || "GROW_OUT"]) + 1,
    };
    summary.pondCards = mergeIntoList(summary.pondCards || [], record);
    return responseData;
  }

  if (mutation.action !== "mortality") return responseData;

  const count = toNumber(mutation.payload?.count);
  summary.totalFishes = Math.max(toNumber(summary.totalFishes) - count, 0);
  summary.totalMortality = toNumber(summary.totalMortality) + count;
  summary.weeklyMortality = toNumber(summary.weeklyMortality) + count;
  summary.monthlyMortality = toNumber(summary.monthlyMortality) + count;
  summary.pondCards = mergeIntoList(summary.pondCards || [], record);
  return responseData;
}

function buildFeedRecord(payload, requestId, now, baseRecord = null) {
  const quantity = toNumber(payload?.quantity, toNumber(baseRecord?.quantity));
  const unitCost = toNumber(payload?.unitCost, toNumber(baseRecord?.unitCost));
  return createBaseRecord(
    {
      ...(baseRecord || {}),
      id: baseRecord?.id || `offline-feeds-${requestId}`,
      batchType: payload?.batchType ?? baseRecord?.batchType ?? "OTHER",
      quantity,
      unitCost,
      totalCost: quantity * unitCost,
      date: payload?.date ?? baseRecord?.date ?? todayDateOnly(),
      note: payload?.note ?? baseRecord?.note ?? null,
      updatedAt: now,
    },
    requestId,
    now,
  );
}

function buildFishPondRecord(payload, requestId, now, baseRecord = null) {
  return createBaseRecord(
    {
      ...(baseRecord || {}),
      id: baseRecord?.id || `offline-fishpond-${requestId}`,
      pondName: payload?.pondName ?? baseRecord?.pondName ?? "",
      pondType: payload?.pondType ?? baseRecord?.pondType ?? "GROW_OUT",
      status: payload?.status ?? baseRecord?.status ?? "ACTIVE",
      capacity:
        payload?.capacity == null ? baseRecord?.capacity ?? null : toNumber(payload.capacity),
      currentStock:
        payload?.currentStock == null
          ? baseRecord?.currentStock ?? null
          : toNumber(payload.currentStock),
      lastWaterChange:
        payload?.lastWaterChange ?? baseRecord?.lastWaterChange ?? todayDateOnly(),
      note: payload?.note ?? baseRecord?.note ?? null,
      updatedAt: now,
    },
    requestId,
    now,
  );
}

function buildFishPondStockAdjustment(payload, requestId, now, baseRecord = null) {
  const change =
    payload?.quantityChange == null
      ? toNumber(payload?.quantity)
      : toNumber(payload?.quantityChange);
  return createBaseRecord(
    {
      ...(baseRecord || {}),
      id: baseRecord?.id || `offline-fishpond-adjust-${requestId}`,
      currentStock: toNumber(baseRecord?.currentStock) + change,
      note: payload?.reason ?? payload?.note ?? baseRecord?.note ?? null,
      updatedAt: now,
    },
    requestId,
    now,
  );
}

function buildFishHatchRecord(payload, requestId, now, baseRecord = null, context = null) {
  const maleCount = toNumber(payload?.maleCount, toNumber(baseRecord?.maleCount));
  const femaleCount = toNumber(payload?.femaleCount, toNumber(baseRecord?.femaleCount));
  const quantityHatched = toNumber(
    payload?.quantityHatched,
    toNumber(baseRecord?.quantityHatched),
  );
  const totalParents = maleCount + femaleCount;
  return createBaseRecord(
    {
      ...(baseRecord || {}),
      id: baseRecord?.id || `offline-fish-hatch-${requestId}`,
      pondId: payload?.pondId ?? baseRecord?.pondId ?? null,
      pondName: context?.pondName ?? baseRecord?.pondName ?? `Pond #${payload?.pondId || ""}`.trim(),
      hatchDate: payload?.hatchDate ?? baseRecord?.hatchDate ?? todayDateOnly(),
      maleCount,
      femaleCount,
      quantityHatched,
      hatchRate:
        totalParents > 0
          ? Number(((quantityHatched / totalParents) * 100).toFixed(1))
          : 0,
      note: payload?.note ?? baseRecord?.note ?? null,
      updatedAt: now,
    },
    requestId,
    now,
  );
}

function buildLivestockRecord(payload, requestId, now, baseRecord = null) {
  return createBaseRecord(
    {
      ...(baseRecord || {}),
      id: baseRecord?.id || `offline-livestock-${requestId}`,
      batchName: payload?.batchName ?? baseRecord?.batchName ?? "",
      type: payload?.type ?? baseRecord?.type ?? "OTHER",
      currentStock:
        payload?.currentStock == null
          ? baseRecord?.currentStock ?? null
          : toNumber(payload.currentStock),
      arrivalDate: payload?.arrivalDate ?? baseRecord?.arrivalDate ?? todayDateOnly(),
      sourceType: payload?.sourceType ?? baseRecord?.sourceType ?? "FARM_BIRTH",
      keepingMethod: payload?.keepingMethod ?? baseRecord?.keepingMethod ?? null,
      startingAgeInWeeks:
        payload?.startingAgeInWeeks == null
          ? baseRecord?.startingAgeInWeeks ?? null
          : toNumber(payload.startingAgeInWeeks),
      mortality:
        payload?.mortality == null
          ? baseRecord?.mortality ?? 0
          : toNumber(payload.mortality),
      note: payload?.note ?? baseRecord?.note ?? null,
      updatedAt: now,
    },
    requestId,
    now,
  );
}

function buildLivestockMortalityRecord(payload, requestId, now, baseRecord = null) {
  const count = toNumber(payload?.count);
  const mortalityDate = payload?.mortalityDate ?? todayDateOnly();
  return createBaseRecord(
    {
      ...(baseRecord || {}),
      id: baseRecord?.id || `offline-livestock-mortality-${requestId}`,
      currentStock: Math.max(toNumber(baseRecord?.currentStock) - count, 0),
      mortality: toNumber(baseRecord?.mortality) + count,
      mortalityThisWeek: toNumber(baseRecord?.mortalityThisWeek) + count,
      mortalityThisMonth: toNumber(baseRecord?.mortalityThisMonth) + count,
      lastMortalityDate: mortalityDate,
      note: payload?.note ?? baseRecord?.note ?? null,
      updatedAt: now,
    },
    requestId,
    now,
  );
}

function patchLivestockSummary(responseData, mutation, path) {
  const summary = responseData?.data;
  const record = mutation?.optimisticData;
  if (!summary || !record) return responseData;

  if (path === "/api/livestock/summary") {
    if (mutation.action === "create") {
      summary.totalLivestockBatches = toNumber(summary.totalLivestockBatches) + 1;
      summary.totalQuantityAlive = toNumber(summary.totalQuantityAlive) + toNumber(record.currentStock);
      summary.totalMortality = toNumber(summary.totalMortality) + toNumber(record.mortality);
      summary.countByType = {
        ...(summary.countByType || {}),
        [record.type || "OTHER"]:
          toNumber(summary?.countByType?.[record.type || "OTHER"]) + toNumber(record.currentStock),
      };
      return responseData;
    }

    if (mutation.action === "mortality") {
      const count = toNumber(mutation.payload?.count);
      summary.totalQuantityAlive = Math.max(toNumber(summary.totalQuantityAlive) - count, 0);
      summary.totalMortality = toNumber(summary.totalMortality) + count;
      summary.weeklyMortality = toNumber(summary.weeklyMortality) + count;
      summary.monthlyMortality = toNumber(summary.monthlyMortality) + count;
    }

    return responseData;
  }

  if (path === "/api/livestock/overview" && mutation.action === "mortality") {
    const count = toNumber(mutation.payload?.count);
    summary.totals = {
      ...(summary.totals || {}),
      totalAlive: Math.max(toNumber(summary?.totals?.totalAlive) - count, 0),
      totalMortality: toNumber(summary?.totals?.totalMortality) + count,
      weeklyMortality: toNumber(summary?.totals?.weeklyMortality) + count,
      monthlyMortality: toNumber(summary?.totals?.monthlyMortality) + count,
      mortalityRate: toNumber(record.mortalityRate, toNumber(summary?.totals?.mortalityRate)),
    };
    summary.batchCards = mergeIntoList(summary.batchCards || [], record);
    summary.mortalityByBatch = mergeIntoList(summary.mortalityByBatch || [], record);
    summary.meta = {
      ...(summary.meta || {}),
      lastUpdated: record.updatedAt || nowIso(),
    };
  }

  return responseData;
}

function buildInventoryAdjustmentRecord(payload, requestId, now, baseRecord = null) {
  const change = toNumber(payload?.quantityChange);
  const quantity = toNumber(baseRecord?.quantity) + change;
  return createBaseRecord(
    {
      ...(baseRecord || {}),
      id: baseRecord?.id || `offline-inventory-adjust-${requestId}`,
      quantity,
      totalValue: quantity * toNumber(baseRecord?.unitCost),
      note: payload?.note ?? baseRecord?.note ?? null,
      lastUpdated: todayDateOnly(),
      updatedAt: now,
    },
    requestId,
    now,
  );
}

function buildTaskRecord(action, payload, requestId, now, baseRecord = null) {
  const normalizedAction = String(action || "create").toLowerCase();
  const nextRecord = createBaseRecord(
    {
      ...(baseRecord || {}),
      id: baseRecord?.id || `offline-task-${requestId}`,
      title: payload?.title ?? baseRecord?.title ?? "",
      description: payload?.description ?? baseRecord?.description ?? null,
      type: payload?.type ?? baseRecord?.type ?? "OTHER",
      dueDate: normalizeDate(payload?.dueDate, normalizeDate(baseRecord?.dueDate)),
      priority: toNumber(payload?.priority, toNumber(baseRecord?.priority, 3)),
      source: payload?.source ?? baseRecord?.source ?? "MANUAL",
      status: payload?.status ?? baseRecord?.status ?? "PENDING",
      completed: Boolean(baseRecord?.completed),
      completedAt: baseRecord?.completedAt ?? null,
      deleted: Boolean(baseRecord?.deleted),
      deletedAt: baseRecord?.deletedAt ?? null,
      updatedAt: now,
    },
    requestId,
    now,
  );

  if (normalizedAction === "complete") {
    nextRecord.completed = true;
    nextRecord.completedAt = now;
    nextRecord.status = "COMPLETED";
  }

  if (normalizedAction === "delete") {
    nextRecord.deleted = true;
    nextRecord.deletedAt = now;
  }

  return nextRecord;
}

function patchTaskList(responseData, mutation, path) {
  if (!responseData || typeof responseData !== "object" || !mutation?.optimisticData) {
    return responseData;
  }

  const payload = responseData.data;
  const resolved = resolveItemArray(payload);
  if (!resolved) return responseData;

  const currentItems = Array.isArray(resolved.items) ? [...resolved.items] : [];
  const record = mutation.optimisticData;
  let nextItems = currentItems;

  if (mutation.action === "delete" || mutation.action === "complete") {
    nextItems = removeFromList(currentItems, record);
  } else {
    nextItems = mergeIntoList(currentItems, record, {
      prepend: mutation.action === "create",
    });
  }

  nextItems = sortTasks(nextItems.filter((item) => !isTaskHidden(item)));

  if (path === "/api/tasks/upcoming") {
    nextItems = nextItems.slice(0, 4);
  }

  resolved.setItems(nextItems);
  updateCollectionTotal(resolved, currentItems, nextItems);
  return responseData;
}

const RESOURCE_CONFIGS = {
  sales: {
    listPath: "/api/sales",
    summaryPath: "/api/sales/summary",
    detailPattern: /^\/api\/sales\/([^/]+)$/,
    buildRecord(action, payload, requestId, now, baseRecord) {
      return buildSalesRecord(payload, requestId, now, baseRecord);
    },
    patchSummary: patchSalesSummary,
  },
  supplies: {
    listPath: "/api/supplies",
    summaryPath: "/api/supplies/summary",
    detailPattern: /^\/api\/supplies\/([^/]+)$/,
    buildRecord(action, payload, requestId, now, baseRecord) {
      return buildSuppliesRecord(payload, requestId, now, baseRecord);
    },
    patchSummary: patchSuppliesSummary,
  },
  inventory: {
    listPath: "/api/inventory",
    summaryPath: "/api/inventory/summary",
    detailPattern: /^\/api\/inventory\/([^/]+)$/,
    buildRecord(action, payload, requestId, now, baseRecord) {
      if (action === "adjust") {
        return buildInventoryAdjustmentRecord(payload, requestId, now, baseRecord);
      }
      return buildInventoryRecord(payload, requestId, now, baseRecord);
    },
    patchSummary: patchInventorySummary,
  },
  eggs: {
    listPath: "/api/eggs",
    summaryPath: "/api/eggs/summary",
    detailPattern: /^\/api\/eggs\/([^/]+)$/,
    buildRecord(action, payload, requestId, now, baseRecord, context) {
      return buildEggRecord(payload, requestId, now, baseRecord, context);
    },
    patchSummary: patchEggSummary,
  },
  feeds: {
    listPath: "/api/feeds",
    summaryPath: "/api/feeds/summary",
    detailPattern: /^\/api\/feeds\/([^/]+)$/,
    buildRecord(action, payload, requestId, now, baseRecord) {
      return buildFeedRecord(payload, requestId, now, baseRecord);
    },
  },
  fishpond: {
    listPath: "/api/fishpond",
    summaryPath: "/api/fishpond/summary",
    detailPattern: /^\/api\/fishpond\/([^/]+)$/,
    buildRecord(action, payload, requestId, now, baseRecord) {
      if (action === "mortality") {
        return buildFishPondMortalityRecord(payload, requestId, now, baseRecord);
      }
      if (action === "adjust") {
        return buildFishPondStockAdjustment(payload, requestId, now, baseRecord);
      }
      return buildFishPondRecord(payload, requestId, now, baseRecord);
    },
    patchSummary: patchFishPondSummary,
  },
  "fish-hatch": {
    listPath: "/api/fish-hatch",
    summaryPath: "/api/fish-hatch/summary",
    detailPattern: /^\/api\/fish-hatch\/([^/]+)$/,
    buildRecord(action, payload, requestId, now, baseRecord, context) {
      return buildFishHatchRecord(payload, requestId, now, baseRecord, context);
    },
  },
  livestock: {
    listPath: "/api/livestock",
    summaryPath: "/api/livestock/summary",
    summaryPaths: ["/api/livestock/overview"],
    detailPattern: /^\/api\/livestock\/([^/]+)$/,
    buildRecord(action, payload, requestId, now, baseRecord) {
      if (action === "mortality") {
        return buildLivestockMortalityRecord(payload, requestId, now, baseRecord);
      }
      return buildLivestockRecord(payload, requestId, now, baseRecord);
    },
    patchSummary: patchLivestockSummary,
  },
  tasks: {
    listPaths: ["/api/tasks", "/api/tasks/upcoming"],
    detailPattern: /^\/api\/tasks\/([^/]+)(?:\/complete)?$/,
    buildRecord(action, payload, requestId, now, baseRecord) {
      return buildTaskRecord(action, payload, requestId, now, baseRecord);
    },
    patchList: patchTaskList,
  },
};

export function isOfflinePendingRecord(record) {
  return Boolean(record?.offlinePending);
}

function matchesConfiguredPath(path, candidate) {
  return Boolean(candidate) && path === candidate;
}

function matchesConfiguredPattern(path, candidate) {
  return candidate instanceof RegExp && candidate.test(path);
}

function matchesResourcePath(config, path) {
  if (!config) return false;
  if (matchesConfiguredPath(path, config.listPath) || matchesConfiguredPath(path, config.summaryPath)) {
    return true;
  }

  if ((config.listPaths || []).some((candidate) => matchesConfiguredPath(path, candidate))) {
    return true;
  }

  if ((config.summaryPaths || []).some((candidate) => matchesConfiguredPath(path, candidate))) {
    return true;
  }

  if (
    matchesConfiguredPattern(path, config.detailPattern) ||
    (config.detailPatterns || []).some((candidate) => matchesConfiguredPattern(path, candidate))
  ) {
    return true;
  }

  return false;
}

function isResourceListPath(config, path) {
  if (!config) return false;
  if (matchesConfiguredPath(path, config.listPath)) return true;
  return (config.listPaths || []).some((candidate) => matchesConfiguredPath(path, candidate));
}

function isResourceSummaryPath(config, path) {
  if (!config) return false;
  if (matchesConfiguredPath(path, config.summaryPath)) return true;
  return (config.summaryPaths || []).some((candidate) => matchesConfiguredPath(path, candidate));
}

function isResourceDetailPath(config, path) {
  if (!config) return false;
  if (matchesConfiguredPattern(path, config.detailPattern)) return true;
  return (config.detailPatterns || []).some((candidate) => matchesConfiguredPattern(path, candidate));
}

export function getOfflineResourceConfig(resource) {
  return RESOURCE_CONFIGS[resource] || null;
}

export function detectOfflineResource(pathname) {
  const path = String(pathname || "");
  return (
    Object.entries(RESOURCE_CONFIGS).find(([, config]) => {
      return matchesResourcePath(config, path);
    })?.[0] || null
  );
}

export function buildOptimisticRecord({
  resource,
  action,
  payload,
  requestId,
  now,
  baseRecord = null,
  context = null,
  path = "",
} = {}) {
  const config = getOfflineResourceConfig(resource) || getOfflineResourceConfig(detectOfflineResource(path));
  if (!config) {
    return defaultCreateRecord(resource || "record", payload, requestId, now);
  }

  return config.buildRecord(action, payload, requestId, now, baseRecord, context);
}

export function applyOfflineMutationToResponse({
  responseData,
  resource,
  path,
  mutation,
} = {}) {
  if (!responseData || !mutation?.optimisticData) return responseData;

  const config = getOfflineResourceConfig(resource) || getOfflineResourceConfig(detectOfflineResource(path));
  if (!config) return responseData;

  if (isResourceSummaryPath(config, path) && typeof config.patchSummary === "function") {
    return config.patchSummary(responseData, mutation, path);
  }

  if (isResourceListPath(config, path) && typeof config.patchList === "function") {
    return config.patchList(responseData, mutation, path);
  }

  if (isResourceListPath(config, path)) {
    return patchPaginatedResponse(responseData, mutation.optimisticData, {
      prepend: mutation.action === "create",
    });
  }

  if (isResourceDetailPath(config, path)) {
    return patchSingleResponse(responseData, mutation.optimisticData);
  }

  return responseData;
}
