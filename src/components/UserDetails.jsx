import React, { useState } from "react";
import { supabase } from "../supabase";

function UserDetails({ user, users, setUsers, setSelectedUser, onBack }) {
  const [paymentRecipient, setPaymentRecipient] = useState("");
  const [paymentAmount, setPaymentAmount] = useState("");

  const handlePayment = async () => {
    if (!paymentRecipient || paymentAmount <= 0) {
      alert("Debes seleccionar una persona y un monto válido.");
      return;
    }

    const debt = user.debts.find((d) => d.person === paymentRecipient);
    if (!debt) {
      alert(`${user.name} no tiene deudas con ${paymentRecipient}.`);
      return;
    }

    const remainingDebt = debt.amount - Math.ceil(parseFloat(paymentAmount));

    if (remainingDebt < 0) {
      alert("El monto a pagar excede la deuda actual.");
      return;
    }

    const confirmPayment = window.confirm(
      `¿Confirmas que ${user.name} pagará $${Math.ceil(paymentAmount)} a ${paymentRecipient}?`
    );

    if (!confirmPayment) return;

    const updatedDebts =
      remainingDebt > 0
        ? user.debts.map((d) =>
            d.person === paymentRecipient ? { ...d, amount: remainingDebt } : d
          )
        : user.debts.filter((d) => d.person !== paymentRecipient);

    const { error } = await supabase
      .from("users")
      .update({ debts: updatedDebts })
      .eq("id", user.id);

    if (error) {
      console.error("Error actualizando la deuda:", error.message);
      return;
    }

    const { error: logError } = await supabase.from("payments_log").insert([
      {
        payer: user.name,
        participants: [paymentRecipient],
        amount: Math.ceil(paymentAmount),
        type: "payment",
      },
    ]);

    if (logError) {
      console.error("Error registrando el log del pago:", logError.message);
      return;
    }

    // Obtener usuarios actualizados de Supabase
    const { data: updatedUsers, error: fetchError } = await supabase
      .from("users")
      .select("*");

    if (fetchError) {
      console.error("Error actualizando los usuarios:", fetchError.message);
      return;
    }

    setUsers(updatedUsers);

    // Actualizar el usuario seleccionado con los datos más recientes
    const updatedSelectedUser = updatedUsers.find((u) => u.id === user.id);
    setSelectedUser(updatedSelectedUser);

    setPaymentRecipient("");
    setPaymentAmount("");
    alert("El pago se ha realizado correctamente.");
  };

  return (
    <div className="details-view">
      <button className="back-button" onClick={onBack}>
        Volver
      </button>
      <h2>Deudas de {user.name}</h2>
      <ul>
        {user.debts.length > 0 ? (
          user.debts.map((debt, index) => (
            <li key={index}>
              {debt.person}: ${Math.ceil(debt.amount)}
            </li>
          ))
        ) : (
          <p>No hay deudas registradas para este usuario.</p>
        )}
      </ul>

      <h2>¿Quién le debe a {user.name}?</h2>
      <table className="owed-table">
        <thead>
          <tr>
            <th>Persona</th>
            <th>Monto</th>
          </tr>
        </thead>
        <tbody>
          {users
            .filter((u) =>
              u.debts.some((debt) => debt.person === user.name)
            )
            .map((u) => {
              const debt = u.debts.find((d) => d.person === user.name);
              return (
                <tr key={u.id}>
                  <td>{u.name}</td>
                  <td>${Math.ceil(debt.amount)}</td>
                </tr>
              );
            })}
        </tbody>
      </table>

      <div className="payment-section">
        <h3>Realizar Pago</h3>
        <select
          value={paymentRecipient}
          onChange={(e) => setPaymentRecipient(e.target.value)}
        >
          <option value="">Seleccionar persona</option>
          {user.debts.map((debt, index) => (
            <option key={index} value={debt.person}>
              {debt.person} (Deuda: ${Math.ceil(debt.amount)})
            </option>
          ))}
        </select>
        <input
          type="number"
          placeholder="Monto a pagar"
          value={paymentAmount}
          onChange={(e) => setPaymentAmount(e.target.value)}
        />
        <button onClick={handlePayment}>Pagar</button>
      </div>
    </div>
  );
}

export default UserDetails;
