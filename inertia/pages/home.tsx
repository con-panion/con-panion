import { Head, Link, usePage } from '@inertiajs/react';
import { route } from '@izzyjs/route/client';

import type User from '#models/user';

import { Notifications } from '~/components/notifications';

export default function Home() {
	const { user } = usePage().props as unknown as { user: User | null };

	return (
		<>
			<Head title="Home" />

			<h1 className="text-3xl font-bold underline">Hello world!</h1>
			{user ? (
				<Link href="#" className="underline">
					Logout
				</Link>
			) : (
				<>
					<Link href="#" className="underline">
						Login
					</Link>
					<span> | </span>
					<Link href={route('auth.register').url} className="underline">
						Register
					</Link>
				</>
			)}
			<Notifications />
		</>
	);
}
