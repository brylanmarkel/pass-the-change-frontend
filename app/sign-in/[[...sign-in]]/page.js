import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FBF7F2] p-4">
      <SignIn
        appearance={{
          elements: {
            rootBox: "mx-auto",
            card: "shadow-none bg-[#FFF8F2] border border-[#E0D5CB]",
          },
          variables: {
            colorPrimary: "#5C4A38",
            colorBackground: "#FFF8F2",
            colorInputBackground: "#FBF7F2",
            colorInputText: "#2E2218",
            borderRadius: "8px",
          },
        }}
      />
    </div>
  );
}
