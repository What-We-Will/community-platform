import { Suspense } from 'react'
import { UpdatePasswordForm } from "./update-password-form";

export default function UpdatePasswordPage() {
    return (
        <Suspense fallback={<>...</>}>
            <UpdatePasswordForm />
        </Suspense>
    );
}