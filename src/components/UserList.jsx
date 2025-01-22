import React from "react";
import { supabase } from "../supabase"; // Asegúrate de que la ruta sea correcta

function UserList({ users, onUserClick, removeUser }) {
  return (
    <div className="user-list">
      <h2>Usuarios</h2>
      {users.map((user) => (
        <div key={user.id} className="user-item">
          <span className="user-name" onClick={() => onUserClick(user)}>
            {user.name}
          </span>
          <button onClick={() => removeUser(user.id)}>Eliminar</button>
        </div>
      ))}
    </div>
  );
}

export default UserList;
