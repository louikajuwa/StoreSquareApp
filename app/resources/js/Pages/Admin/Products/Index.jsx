import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';
import AdminNav from '@/Components/AdminNav';
import Pagination from '@/Components/Pagination';

function EditIcon() {
    return (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
    );
}

function TrashIcon() {
    return (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
    );
}

function ProductAvatar() {
    return (
        <div className="w-10 h-10 rounded-xl bg-cyan-50 flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                    d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
        </div>
    );
}

function DeleteModal({ product, onConfirm, onCancel, deleting }) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-gray-900/50 backdrop-blur-sm"
                onClick={onCancel}
            />

            {/* Dialog */}
            <div className="relative bg-white rounded-2xl shadow-xl border border-gray-100 w-full max-w-sm p-6">
                {/* Icon */}
                <div className="w-12 h-12 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                </div>

                <h2 className="text-base font-bold text-gray-900 text-center mb-1">Delete product?</h2>
                <p className="text-sm text-gray-500 text-center mb-6">
                    <span className="font-semibold text-gray-700">"{product.name}"</span> will be permanently deleted.
                    This cannot be undone.
                </p>

                <div className="flex gap-3">
                    <button
                        onClick={onCancel}
                        disabled={deleting}
                        className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={deleting}
                        className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-sm font-semibold text-white transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {deleting ? (
                            <>
                                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                                </svg>
                                Deleting…
                            </>
                        ) : 'Delete'}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default function AdminProductsIndex({ products }) {
    const [confirmProduct, setConfirmProduct] = useState(null);
    const [deleting,       setDeleting]       = useState(false);

    const handleDelete = (product) => setConfirmProduct(product);

    const confirmDelete = () => {
        setDeleting(true);
        router.delete(`/admin/products/${confirmProduct.id}`, {
            preserveScroll: true,
            onFinish: () => {
                setDeleting(false);
                setConfirmProduct(null);
            },
        });
    };

    return (
        <>
            <Head title="Products — Admin" />
            <div className="min-h-screen bg-gray-50">
                <AdminNav />

                <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">

                    {/* Page header */}
                    <div className="flex items-center justify-between gap-4 mb-5 sm:mb-6">
                        <div>
                            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Products</h1>
                            <p className="text-xs sm:text-sm text-gray-400 mt-0.5">
                                {products.total} {products.total === 1 ? 'product' : 'products'} in your store
                            </p>
                        </div>
                        <Link
                            href="/admin/products/create"
                            className="inline-flex items-center gap-2 px-4 sm:px-5 py-2.5 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl text-sm font-semibold transition-colors shadow-sm flex-shrink-0"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            <span className="hidden sm:inline">Add Product</span>
                            <span className="sm:hidden">Add</span>
                        </Link>
                    </div>

                    {/* Card / Table */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                        {products.data.length === 0 ? (
                            <div className="text-center py-16 px-6">
                                <div className="w-14 h-14 bg-cyan-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                    <svg className="w-7 h-7 text-cyan-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                                            d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                    </svg>
                                </div>
                                <p className="font-semibold text-gray-700 mb-1">No products yet</p>
                                <p className="text-sm text-gray-400 mb-6">Add your first product to start selling.</p>
                                <Link
                                    href="/admin/products/create"
                                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-cyan-600 text-white rounded-xl text-sm font-semibold hover:bg-cyan-700 transition-colors"
                                >
                                    Create product
                                </Link>
                            </div>
                        ) : (
                            <>
                                {/* ── Mobile: card list ── */}
                                <div className="sm:hidden divide-y divide-gray-50 min-h-[520px] max-h-[520px] overflow-y-auto">
                                    {products.data.map((product) => (
                                        <div key={product.id} className="flex items-center gap-3 p-4">
                                            <ProductAvatar />
                                            <div className="flex-1 min-w-0">
                                                <p className="font-semibold text-sm text-gray-900 truncate">
                                                    {product.name}
                                                </p>
                                                <p className="text-xs text-gray-400 mt-0.5">
                                                    #{product.id}
                                                </p>
                                            </div>
                                            <div className="flex flex-col items-end gap-2 flex-shrink-0">
                                                <span className="font-bold text-gray-900 text-sm">
                                                    ${parseFloat(product.price).toFixed(2)}
                                                </span>
                                                <div className="flex items-center gap-1.5">
                                                    <Link
                                                        href={`/admin/products/${product.id}/edit`}
                                                        className="w-8 h-8 flex items-center justify-center text-cyan-600 hover:bg-cyan-50 rounded-lg transition-colors"
                                                        aria-label="Edit"
                                                    >
                                                        <EditIcon />
                                                    </Link>
                                                    <button
                                                        onClick={() => handleDelete(product)}
                                                        className="w-8 h-8 flex items-center justify-center text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                                        aria-label="Delete"
                                                    >
                                                        <TrashIcon />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* ── Desktop: table ── */}
                                <div className="hidden sm:block overflow-x-auto min-h-[520px] max-h-[520px] overflow-y-auto">
                                    <table className="w-full">
                                        <thead className="sticky top-0 z-10">
                                            <tr className="border-b border-gray-100 bg-gray-50/90 backdrop-blur-sm">
                                                <th className="text-left px-6 py-3.5 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                                                    Product
                                                </th>
                                                <th className="text-left px-6 py-3.5 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                                                    ID
                                                </th>
                                                <th className="text-left px-6 py-3.5 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                                                    Price
                                                </th>
                                                <th className="text-right px-6 py-3.5 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                                                    Actions
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-50">
                                            {products.data.map((product) => (
                                                <tr key={product.id} className="hover:bg-gray-50/70 transition-colors">
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-3">
                                                            <ProductAvatar />
                                                            <span className="font-semibold text-gray-900 text-sm">
                                                                {product.name}
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className="text-xs font-mono text-gray-400 bg-gray-100 px-2 py-1 rounded-lg">
                                                            #{product.id}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className="font-bold text-gray-900">
                                                            ${parseFloat(product.price).toFixed(2)}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center justify-end gap-2">
                                                            <Link
                                                                href={`/admin/products/${product.id}/edit`}
                                                                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-cyan-600 bg-cyan-50 hover:bg-cyan-100 rounded-lg transition-colors"
                                                            >
                                                                <EditIcon />
                                                                Edit
                                                            </Link>
                                                            <button
                                                                onClick={() => handleDelete(product)}
                                                                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-red-500 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                                                            >
                                                                <TrashIcon />
                                                                Delete
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </>
                        )}
                    </div>

                    <Pagination links={products.links} meta={products} />
                </main>
            </div>

            {/* Delete confirmation modal */}
            {confirmProduct && (
                <DeleteModal
                    product={confirmProduct}
                    onConfirm={confirmDelete}
                    onCancel={() => !deleting && setConfirmProduct(null)}
                    deleting={deleting}
                />
            )}
        </>
    );
}
