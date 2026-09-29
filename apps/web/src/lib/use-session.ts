"use client";

import { useEffect, useState } from "react";
import { client, type SessionUser } from "@/lib/api";

export function useSession() {
  const [user, setUser] = useState<SessionUser | null>(null);

  useEffect(() => {
    client
      .me()
      .then((result) => setUser(result.user))
      .catch(() => setUser(null));
  }, []);

  return user;
}
