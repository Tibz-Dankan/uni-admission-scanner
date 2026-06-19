export class AppDate {
  static toInputDate(value: string | null | undefined): string {
    if (!value) return "";
    return value.slice(0, 10);
  }

  static toHuman(value: string | null | undefined): string {
    if (!value) return "—";
    const parts = value.slice(0, 10).split("-").map(Number);
    if (parts.length !== 3 || parts.some(isNaN)) return "—";
    const [year, month, day] = parts;
    return new Date(year, month - 1, day).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  }

  static toHumanDateTime(value: string | null | undefined): string {
    if (!value) return "—";
    const d = new Date(value);
    if (isNaN(d.getTime())) return "—";
    return d.toLocaleString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }
}
