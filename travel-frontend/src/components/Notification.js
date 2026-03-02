import { Snackbar, Alert } from "@mui/material";

export default function Notification({ open, message, severity, onClose }) {
  return (
    <Snackbar open={open} autoHideDuration={4000} onClose={onClose}>
      <Alert severity={severity || "info"} onClose={onClose}>
        {message}
      </Alert>
    </Snackbar>
  );
}