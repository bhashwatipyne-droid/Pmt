import { createContext, useContext, useEffect, useState } from "react";
import { getUsers } from "@/services/api";

const UserContext = createContext(null);

export const UserProvider = ({ children }) => {
  const [users, setUsers] = useState([]);
  const [currentUserId, setCurrentUserId] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getUsers()
      .then((data) => {
        setUsers(data);
        const stored = localStorage.getItem("acting_user_id");
        if (stored && data.some((u) => u.id === stored)) {
          setCurrentUserId(stored);
        } else if (data.length) {
          setCurrentUserId(data[0].id);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const setCurrentUser = (id) => {
    setCurrentUserId(id);
    localStorage.setItem("acting_user_id", id);
  };

  const currentUser = users.find((u) => u.id === currentUserId) || null;

  return (
    <UserContext.Provider value={{ users, currentUser, currentUserId, setCurrentUser, loading }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => useContext(UserContext);
