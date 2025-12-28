type Props = {
  category?: string;
  sub?: string | null;
};

export default function Breadcrumb({ category, sub }: Props) {
  return (
    <p className="text-sm text-gray-500 mb-4">
      Home
      {category && ` > ${category}`}
      {sub && ` > ${sub}`}
    </p>
  );
}