import Image from 'next/image';

export default function Home() {
  return (
    <main>
      <div className="row align-items-center mb-5">
        <div className="col-md-6">
          <h1 className="mb-4">Welcome to the School Assignment Management System</h1>
          <p className="lead text-muted">
            Master professional tailoring and garment design with our comprehensive digital platform. 
            Learn pattern making, fitting techniques, and fashion design in a modern educational environment.
          </p>
        </div>
        <div className="col-md-6">
          <div className="home-image-container">
            <Image
              src="/images/tailoring-professional.jpg"
              alt="Professional Tailoring Class"
              fill
              className="rounded shadow-lg"
              style={{ objectFit: 'cover' }}
              priority
              unoptimized
            />
          </div>
        </div>
      </div>
    </main>
  );
}
