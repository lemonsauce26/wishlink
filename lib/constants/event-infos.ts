export const EVENT_INFOS = [
  { value: "birthday",      label: "Birthday",        emoji: "🎂" },
  { value: "mothers_day",   label: "Mother's Day",    emoji: "🌸" },
  { value: "fathers_day",   label: "Father's Day",    emoji: "👨" },
  { value: "valentines",    label: "Valentine's Day", emoji: "💝" },
  { value: "christmas",     label: "Christmas",       emoji: "🎄" },
  { value: "hanukkah",      label: "Hanukkah",        emoji: "🕎" },
  { value: "engagement",    label: "Engagement",      emoji: "💍" },
  { value: "bridal_shower", label: "Bridal Shower",   emoji: "👰" },
  { value: "wedding",       label: "Wedding",         emoji: "🥂" },
  { value: "anniversary",   label: "Anniversary",     emoji: "🎊" },
  { value: "baby_shower",   label: "Baby Shower",     emoji: "👶" },
  { value: "graduation",    label: "Graduation",      emoji: "🎓" },
  { value: "new_job",       label: "New Job",         emoji: "💼" },
  { value: "retirement",    label: "Retirement",      emoji: "🌅" },
  { value: "housewarming",  label: "Housewarming",    emoji: "🏠" },
  { value: "just_because",  label: "Just Because",    emoji: "🎉" },
] as const;

export const EVENT_EMOJI = Object.fromEntries(
  EVENT_INFOS.map((t) => [t.value, t.emoji])
);
