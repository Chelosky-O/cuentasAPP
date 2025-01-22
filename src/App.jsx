import React, { useState, useEffect } from "react";
import "./App.css";

function App() {
  const [users, setUsers] = useState([]);
  const [newUserName, setNewUserName] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);
  const [debtPerson, setDebtPerson] = useState("");
  const [debtAmount, setDebtAmount] = useState("");
  const [view, setView] = useState("main");
  const [expenseAmount, setExpenseAmount] = useState("");
  const [payer, setPayer] = useState("");
  const [participants, setParticipants] = useState([]);

  // Load users from localStorage on app load
  useEffect(() => {
    const storedUsers = JSON.parse(localStorage.getItem("users")) || [];
    setUsers(storedUsers);
  }, []);

  // Save users to localStorage whenever they change
  useEffect(() => {
    if (users.length > 0) {
      localStorage.setItem("users", JSON.stringify(users));
    }
  }, [users]);

  // Add a new user
  const addUser = () => {
    if (newUserName.trim() === "") return;
    if (users.some((user) => user.name === newUserName)) {
      alert("El usuario ya existe.");
      return;
    }

    const newUser = { name: newUserName, debts: [] };
    setUsers((prevUsers) => [...prevUsers, newUser]);
    setNewUserName("");
  };

  // Remove a user
  const removeUser = (userName) => {
    if (window.confirm(`¿Estás seguro de que deseas eliminar a ${userName}?`)) {
      const updatedUsers = users.filter((user) => user.name !== userName);
      setUsers(updatedUsers);
      localStorage.setItem("users", JSON.stringify(updatedUsers));
    }
  };

  // Add a debt to a user
  const addDebt = () => {
    if (!selectedUser || debtPerson.trim() === "" || debtAmount <= 0) return;

    setUsers((prevUsers) => {
      return prevUsers.map((user) => {
        if (user.name === selectedUser.name) {
          return {
            ...user,
            debts: [...user.debts, { person: debtPerson, amount: parseFloat(debtAmount) }],
          };
        }
        return user;
      });
    });

    setDebtPerson("");
    setDebtAmount("");
  };

  // Add an expense and distribute debts with consideration of existing debts
  const addExpense = () => {
    if (!payer || expenseAmount <= 0 || participants.length === 0) return;

    const amountPerPerson = parseFloat(expenseAmount) / participants.length;

    setUsers((prevUsers) => {
      return prevUsers.map((user) => {
        if (participants.includes(user.name)) {
          if (user.name === payer) return user; // Skip payer

          const existingDebt = user.debts.find((d) => d.person === payer);
          let updatedDebts = [...user.debts];

          if (existingDebt) {
            const newAmount = amountPerPerson - existingDebt.amount;
            if (newAmount > 0) {
              updatedDebts = updatedDebts.map((debt) =>
                debt.person === payer ? { ...debt, amount: newAmount } : debt
              );
            } else {
              updatedDebts = updatedDebts.filter((debt) => debt.person !== payer);
              if (newAmount < 0) {
                const payerIndex = prevUsers.findIndex((u) => u.name === payer);
                if (payerIndex !== -1) {
                  prevUsers[payerIndex].debts.push({
                    person: user.name,
                    amount: -newAmount,
                  });
                }
              }
            }
          } else {
            updatedDebts.push({ person: payer, amount: amountPerPerson });
          }

          return { ...user, debts: updatedDebts };
        }
        return user;
      });
    });

    setExpenseAmount("");
    setPayer("");
    setParticipants([]);
  };

  const handleUserClick = (user) => {
    setSelectedUser(user);
    setView("details");
  };

  const handleBackToMain = () => {
    setSelectedUser(null);
    setView("main");
  };

  return (
    <div className="app-container">
      {view === "main" && (
        <div>
          <h1>CuentasAPP</h1>

          <div className="user-section">
            <h2>Crear Usuario</h2>
            <input
              type="text"
              placeholder="Nombre del usuario"
              value={newUserName}
              onChange={(e) => setNewUserName(e.target.value)}
            />
            <button onClick={addUser}>Agregar Usuario</button>
          </div>

          <div className="expense-section">
            <h2>Agregar Gasto</h2>
            <input
              type="text"
              placeholder="Quién pagó"
              value={payer}
              onChange={(e) => setPayer(e.target.value)}
            />
            <input
              type="number"
              placeholder="Monto total"
              value={expenseAmount}
              onChange={(e) => setExpenseAmount(e.target.value)}
            />
            <div>
              <h3>Participantes</h3>
              {users.map((user) => (
                <label key={user.name}>
                  <input
                    type="checkbox"
                    checked={participants.includes(user.name)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setParticipants((prev) => [...prev, user.name]);
                      } else {
                        setParticipants((prev) => prev.filter((name) => name !== user.name));
                      }
                    }}
                  />
                  {user.name}
                </label>
              ))}
            </div>
            <button onClick={addExpense}>Agregar Gasto</button>
          </div>

          <div className="user-list">
            <h2>Usuarios</h2>
            {users.map((user) => (
              <div key={user.name} className="user-item">
                <span onClick={() => handleUserClick(user)}>{user.name}</span>
                <button
                  className="delete-button"
                  onClick={() => removeUser(user.name)}
                >
                  Eliminar
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {view === "details" && selectedUser && (
        <div className="details-view">
          <button className="back-button" onClick={handleBackToMain}>
            Volver
          </button>
          <h2>Deudas de {selectedUser.name}</h2>
          <ul>
            {users
              .filter((user) => user.name !== selectedUser.name)
              .map((user) => {
                const debt = selectedUser.debts.find((d) => d.person === user.name);
                return (
                  <li key={user.name}>
                    {user.name}: ${debt ? debt.amount : 0}
                  </li>
                );
              })}
          </ul>

          <div className="add-debt">
            <h3>Agregar Deuda</h3>
            <input
              type="text"
              placeholder="Persona"
              value={debtPerson}
              onChange={(e) => setDebtPerson(e.target.value)}
            />
            <input
              type="number"
              placeholder="Monto"
              value={debtAmount}
              onChange={(e) => setDebtAmount(e.target.value)}
            />
            <button onClick={addDebt}>Agregar Deuda</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;