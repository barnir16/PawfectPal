import { BASE_URL } from "../services/api";
export const getFullImageUrl = (path: string | null | undefined): string => {
  if (!path) {
    return "https://placehold.co/150x150/EEEEEE/333333?text=Profile";
  }
  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path;
  }
  return `${BASE_URL}${path}`;
};
