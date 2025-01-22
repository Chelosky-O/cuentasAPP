import React, { useState, useEffect } from "react";
import { get, set } from "@vercel/edge-config";
import "./App.css";

function App() {
  const [users, setUsersState] = useState([]);
  const [newUserName, setNewUserName] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);
  const [debtPerson, setDebtPerson] = useState("");
  const [debtAmount, setDebtAmount] = useState("");
  const [view, setView] = useState("main");
  const [expenseAmount, setExpenseAmount] = useState("");
  const [payer, setPayer] = useState("");
  const [participants, setParticipants] = useState([]);

  // Carga inicial de usuarios desde Edge Config
  useEffect(() => {
    const loadUsers = async () => {
      const storedUsers = (await get("users")) || []; // Carga usuarios desde Edge Config
      setUsersState(storedUsers);
    };
    loadUsers();
  }, []);

  // Guarda los usuarios en Edge Config
  const saveUsers = async (updatedUsers) => {
    await set("users", updatedUsers); // Guarda en Edge Config
    setUsersState(updatedUsers);
  };

  // Agregar un nuevo usuario
  const addUser = async () => {
    if (newUserName.trim() === "") return;
    if (users.some((user) => user.name === newUserName)) {
      alert("El usuario ya existe.");
      return;
    }
    const newUser = { name: newUserName, debts: [] };
    const updatedUsers = [...users, newUser];
    await saveUsers(updatedUsers);
    setNewUserName("");
  };

  // Eliminar un usuario
  const removeUser = async (userName) => {
    if (window.confirm(`¿Estás seguro de que deseas eliminar a ${userName}?`)) {
      const updatedUsers = users.filter((user) => user.name !== userName);
      await saveUsers(updatedUsers);
    }
  };

  // Agregar deuda
  const addDebt = async () => {
    if (!selectedUser || debtPerson.trim() === "" || debtAmount <= 0) return;
    const updatedUsers = users.map((user) => {
      if (user.name === selectedUser.name) {
        return {
          ...user,
          debts: [...user.debts, { person: debtPerson, amount: parseFloat(debtAmount) }],
        };
      }
      return user;
    });
    await saveUsers(updatedUsers);
    setDebtPerson("");
    setDebtAmount("");
  };

  // Agregar gasto y ajustar deudas
  const addExpense = async () => {
    if (!payer || expenseAmount <= 0 || participants.length <= 1) return;
    const amountPerPerson = parseFloat(expenseAmount) / participants.length;

    const updatedUsers = users.map((user) => {
      if (participants.includes(user.name)) {
        if (user.name === payer) return user; // Saltar al pagador

        let updatedDebts = [...user.debts];
        const existingDebtToPayer = user.debts.find((d) => d.person === payer);
        const payerIndex = users.findIndex((u) => u.name === payer);

        const participantDebtToPayer =
          (existingDebtToPayer?.amount || 0) + amountPerPerson;

        if (payerIndex !== -1) {
          const debtFromPayer = users[payerIndex].debts.find(
            (d) => d.person === user.name
          );

          const adjustedDebt =
            participantDebtToPayer - (debtFromPayer?.amount || 0);

          if (adjustedDebt > 0) {
            updatedDebts = updatedDebts.filter((debt) => debt.person !== payer);
            updatedDebts.push({ person: payer, amount: adjustedDebt });
          } else if (adjustedDebt < 0) {
            users[payerIndex].debts = users[payerIndex].debts.filter(
              (debt) => debt.person !== user.name
            );
            users[payerIndex].debts.push({
              person: user.name,
              amount: -adjustedDebt,
            });
            updatedDebts = updatedDebts.filter((debt) => debt.person !== payer);
          } else {
            updatedDebts = updatedDebts.filter((debt) => debt.person !== payer);
            users[payerIndex].debts = users[payerIndex].debts.filter(
              (debt) => debt.person !== user.name
            );
          }
        }

        return { ...user, debts: updatedDebts };
      }
      return user;
    });

    await saveUsers(updatedUsers);
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
            <select value={payer} onChange={(e) => setPayer(e.target.value)}>
              <option value="">Seleccionar pagador</option>
              {users.map((user) => (
              <option key={user.name} value={user.name}>
                {user.name}
              </option>
              ))}
            </select>

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