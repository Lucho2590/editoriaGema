import { Metadata } from "next";
import { notFound } from "next/navigation";
import { getBookBySlug, getBooks } from "@/server/actions/books";
import { BookDetail } from "@/components/books/BookDetail";

interface BookPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: BookPageProps): Promise<Metadata> {
  const { slug } = await params;
  const book = await getBookBySlug(slug);

  if (!book) {
    return {
      title: "Libro no encontrado",
    };
  }

  return {
    title: book.title,
    description: book.description.slice(0, 160),
    openGraph: {
      title: book.title,
      description: book.description.slice(0, 160),
      images: [book.coverImage],
    },
  };
}

export async function generateStaticParams() {
  const books = await getBooks();
  return books.map((book) => ({
    slug: book.slug,
  }));
}

export default async function BookPage({ params }: BookPageProps) {
  const { slug } = await params;
  const book = await getBookBySlug(slug);

  if (!book) {
    notFound();
  }

  return (
    <div className="page-transition">
      <section className="section">
        <div className="max-w-content mx-auto">
          <BookDetail book={book} />
        </div>
      </section>
    </div>
  );
}
