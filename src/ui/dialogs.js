import Swal from "sweetalert2";
import { currentTheme } from "./theme.js";

export async function confirmAction(message) {
    const result = await Swal.fire({
        text: message,
        theme: currentTheme(),
        showCancelButton: true,
        focusConfirm: false,
    });
    return result.isConfirmed;
}
