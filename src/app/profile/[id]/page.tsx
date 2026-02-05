import { UserProfile } from "@/components/user-profile";

export default async function ProfilePage(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  return <UserProfile userId={id} />;
}
