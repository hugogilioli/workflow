import { NewUserForm } from "./new-user-form";

export default function NewUserPage() {
  return (
    <div className="mx-auto max-w-2xl p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">New User</h1>
        <p className="text-sm text-muted-foreground">
          Create a user account for WorkFlow access.
        </p>
      </div>

      <NewUserForm />
    </div>
  );
}
