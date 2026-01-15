export const startOfDay = (d = new Date()) => {
    const x = new Date(d);
    x.setHours(0, 0, 0, 0);
    return x;
  };
  
  export const endOfDay = (d = new Date()) => {
    const x = new Date(d);
    x.setHours(23, 59, 59, 999);
    return x;
  };
  
  export const startOfWeek = (d = new Date()) => {
    const x = startOfDay(d);
    // week starts Monday
    const day = x.getDay(); // 0 Sun ... 6 Sat
    const diff = (day === 0 ? -6 : 1) - day;
    x.setDate(x.getDate() + diff);
    return x;
  };
  
  export const startOfMonth = (d = new Date()) => {
    const x = startOfDay(d);
    x.setDate(1);
    return x;
  };
  
  export const rangeFromKey = (rangeKey) => {
    const now = new Date();
  
    if (rangeKey === "today") {
      return { from: startOfDay(now), to: endOfDay(now) };
    }
    if (rangeKey === "week") {
      return { from: startOfWeek(now), to: endOfDay(now) };
    }
    if (rangeKey === "month") {
      return { from: startOfMonth(now), to: endOfDay(now) };
    }
    if (rangeKey === "lastMonth") {
      const firstThisMonth = startOfMonth(now);
      const lastMonthEnd = new Date(firstThisMonth.getTime() - 1);
      const lastMonthStart = startOfMonth(lastMonthEnd);
      return { from: lastMonthStart, to: endOfDay(lastMonthEnd) };
    }
  
    return null;
  };
  