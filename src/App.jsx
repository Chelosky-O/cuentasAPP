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
      {/* Aquí sigue el resto de tu JSX */}
    </div>
  );
}

export default App;
