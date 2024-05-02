import { Head } from '@inertiajs/react';

interface HomeProps {
	version: number;
}

export default function Home({ version }: HomeProps) {
	return (
		<>
			<Head title="Homepage" />

			<div className="container">
				<div className="title">AdonisJS {version} x Inertia x React</div>

				<span>
					Learn more about AdonisJS and Inertia.js by visiting the{' '}
					<a href="https://docs.adonisjs.com/guides/inertia">AdonisJS documentation</a>.
				</span>
			</div>
		</>
	);
}
