"use client"

import { defineRouteConfig } from "@medusajs/admin-sdk"
import { 
  ShoppingBag, 
  Plus, 
  Eye,
  MagnifyingGlass,
  Star,
} from "@medusajs/icons"
import { Container, Heading, Text, Badge, Button, Input, Table, Modal } from "@medusajs/ui"
import { useEffect, useState } from "react"

interface SpaProduct {
  id: string
  name: string
  description: string
  category: string
  price: number
  sku: string
  stock: number
  image_url?: string
  ingredients: string[]
  skinTypes: string[]
  concerns: string[]
  rating: number
  reviews: number
  is_active: boolean
  created_at: string
}

export const config = defineRouteConfig({
  label: "Spa Products",
  icon: ShoppingBag,
})

export default function SpaProductsPage() {
  const [products, setProducts] = useState<SpaProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterCategory, setFilterCategory] = useState<string>("all")
  const [selectedProduct, setSelectedProduct] = useState<SpaProduct | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category: "",
    price: 0,
    sku: "",
    stock: 0,
    image_url: "",
    ingredients: "",
    skinTypes: "",
    concerns: "",
    is_active: true
  })

  useEffect(() => {
    loadProducts()
  }, [])

  const loadProducts = async () => {
    try {
      setLoading(true)
      // Fetch real products from API (using services as products)
      const response = await fetch("/public/services")
      if (!response.ok) {
        throw new Error(`Failed to fetch products: ${response.status}`)
      }
      const data = await response.json()
      // Transform services to products format
      const products = (data.services || []).map((service: any) => ({
        id: service.id,
        name: service.name,
        description: service.description,
        category: service.category || "Services",
        price: service.price,
        sku: `SVC-${service.id}`,
        stock: 999,
        image_url: service.image_url,
        ingredients: [],
        skinTypes: ["All"],
        concerns: [],
        rating: 4.5,
        reviews: 0,
        is_active: service.is_active,
        created_at: service.created_at
      }))
      setProducts(products)
    } catch (error) {
      console.error('Error loading products:', error)
      // Set empty array on error
      setProducts([])
    } finally {
      setLoading(false)
    }
  }

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesFilter = filterCategory === "all" || product.category === filterCategory
    return matchesSearch && matchesFilter
  })

  const categories = ["all", ...Array.from(new Set(products.map(p => p.category)))]

  const formatCurrency = (amount: number) => {
    return `$${amount.toFixed(2)}`
  }

  const getStockColor = (stock: number) => {
    if (stock === 0) return 'red'
    if (stock < 10) return 'orange'
    return 'green'
  }

  const getStockText = (stock: number) => {
    if (stock === 0) return 'Out of Stock'
    if (stock < 10) return 'Low Stock'
    return 'In Stock'
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const productData = {
        name: formData.name,
        description: formData.description,
        category: formData.category,
        price: formData.price,
        image_url: formData.image_url,
        is_active: formData.is_active
      }

      if (editingId) {
        // Update existing product - for now, just update locally
        setProducts(prev => prev.map(product => 
          product.id === editingId 
            ? { ...product, ...productData, id: editingId }
            : product
        ))
      } else {
        // Create new product via API
        const response = await fetch("/admin/products", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(productData)
        })

        if (response.ok) {
          const result = await response.json()
          const newProduct: SpaProduct = {
            id: result.product.id,
            ...productData,
            sku: `SVC-${result.product.id}`,
            stock: 999,
            ingredients: [],
            skinTypes: ["All"],
            concerns: [],
            rating: 4.5,
            reviews: 0,
            created_at: result.product.created_at
          }
          setProducts(prev => [newProduct, ...prev])
        } else {
          throw new Error("Failed to create product")
        }
      }

      setShowForm(false)
      setEditingId(null)
      setFormData({
        name: "",
        description: "",
        category: "",
        price: 0,
        sku: "",
        stock: 0,
        image_url: "",
        ingredients: "",
        skinTypes: "",
        concerns: "",
        is_active: true
      })
    } catch (err) {
      console.error("Error saving product:", err)
      alert("Failed to save product. Please try again.")
    }
  }

  const handleEdit = (product: SpaProduct) => {
    setFormData({
      name: product.name,
      description: product.description,
      category: product.category,
      price: product.price,
      sku: product.sku,
      stock: product.stock,
      image_url: product.image_url || "",
      ingredients: product.ingredients.join(", "),
      skinTypes: product.skinTypes.join(", "),
      concerns: product.concerns.join(", "),
      is_active: product.is_active
    })
    setEditingId(product.id)
    setShowForm(true)
  }

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this product?")) {
      setProducts(prev => prev.filter(product => product.id !== id))
    }
  }

  const handleCancel = () => {
    setShowForm(false)
    setEditingId(null)
    setFormData({
      name: "",
      description: "",
      category: "",
      price: 0,
      sku: "",
      stock: 0,
      image_url: "",
      ingredients: "",
      skinTypes: "",
      concerns: "",
      is_active: true
    })
  }

  if (loading) {
    return (
      <Container className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-ui-bg-subtle rounded w-1/3"></div>
          <div className="h-64 bg-ui-bg-subtle rounded"></div>
        </div>
      </Container>
    )
  }

  return (
    <Container className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Heading level="h1" className="text-2xl font-bold text-ui-fg-base">
            Spa Products
          </Heading>
          <Text className="text-ui-fg-subtle mt-1">
            Manage your spa's skincare products and inventory
          </Text>
        </div>
        <Button variant="primary" onClick={() => setShowForm(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Product
        </Button>
      </div>

      {/* Stats divs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-4 bg-ui-bg-subtle rounded-lg border border-ui-border-base">
          <div className="flex items-center justify-between">
            <div>
              <Text className="text-sm text-ui-fg-subtle">Total Products</Text>
              <Text className="text-2xl font-bold">{products.length}</Text>
            </div>
            <div className="w-8 h-8 text-blue-600">📦</div>
          </div>
        </div>

        <div className="p-4 bg-ui-bg-subtle rounded-lg border border-ui-border-base">
          <div className="flex items-center justify-between">
            <div>
              <Text className="text-sm text-ui-fg-subtle">Active Products</Text>
              <Text className="text-2xl font-bold text-green-600">
                {products.filter(p => p.is_active).length}
              </Text>
            </div>
            <div className="w-8 h-8 text-green-600">🏷️</div>
          </div>
        </div>

        <div className="p-4 bg-ui-bg-subtle rounded-lg border border-ui-border-base">
          <div className="flex items-center justify-between">
            <div>
              <Text className="text-sm text-ui-fg-subtle">Low Stock</Text>
              <Text className="text-2xl font-bold text-orange-600">
                {products.filter(p => p.stock < 10).length}
              </Text>
            </div>
            <div className="w-8 h-8 text-orange-600">📦</div>
          </div>
        </div>

        <div className="p-4 bg-ui-bg-subtle rounded-lg border border-ui-border-base">
          <div className="flex items-center justify-between">
            <div>
              <Text className="text-sm text-ui-fg-subtle">Avg. Rating</Text>
              <div className="flex items-center gap-1">
                <Text className="text-2xl font-bold">
                  {(products.reduce((sum, p) => sum + p.rating, 0) / products.length).toFixed(1)}
                </Text>
                <Star className="w-5 h-5 text-yellow-500 fill-current" />
              </div>
            </div>
            <Star className="w-8 h-8 text-yellow-600" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="p-4">
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <div className="relative">
              <MagnifyingGlass className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-ui-fg-muted" />
              <Input
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 text-ui-fg-muted">⚙️</div>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="px-3 py-2 border border-ui-border-base rounded-md bg-ui-bg-base"
            >
              {categories.map(category => (
                <option key={category} value={category}>
                  {category === "all" ? "All Categories" : category}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Products Table */}
      <div className="p-6 bg-ui-bg-subtle rounded-lg border border-ui-border-base">
        <Table>
          <Table.Header>
            <Table.Row>
              <Table.HeaderCell>Product</Table.HeaderCell>
              <Table.HeaderCell>Category</Table.HeaderCell>
              <Table.HeaderCell>Price</Table.HeaderCell>
              <Table.HeaderCell>Stock</Table.HeaderCell>
              <Table.HeaderCell>Rating</Table.HeaderCell>
              <Table.HeaderCell>Status</Table.HeaderCell>
              <Table.HeaderCell>Actions</Table.HeaderCell>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {filteredProducts.map((product) => (
              <Table.Row key={product.id}>
                <Table.Cell>
                  <div className="flex items-center gap-3">
                    {product.image_url && (
                      <img 
                        src={product.image_url} 
                        alt={product.name}
                        className="w-12 h-12 object-cover rounded-lg"
                      />
                    )}
                    <div>
                      <Text className="font-medium">{product.name}</Text>
                      <Text className="text-sm text-ui-fg-subtle">
                        SKU: {product.sku}
                      </Text>
                    </div>
                  </div>
                </Table.Cell>
                <Table.Cell>
                  <Badge color="blue">{product.category}</Badge>
                </Table.Cell>
                <Table.Cell>
                  <Text className="font-semibold">{formatCurrency(product.price)}</Text>
                </Table.Cell>
                <Table.Cell>
                  <div className="text-center">
                    <Text className="font-medium">{product.stock}</Text>
                    <Badge color={getStockColor(product.stock)} className="text-xs">
                      {getStockText(product.stock)}
                    </Badge>
                  </div>
                </Table.Cell>
                <Table.Cell>
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 text-yellow-500 fill-current" />
                    <Text className="font-medium">{product.rating}</Text>
                    <Text className="text-sm text-ui-fg-subtle">
                      ({product.reviews})
                    </Text>
                  </div>
                </Table.Cell>
                <Table.Cell>
                  <Badge color={product.is_active ? 'green' : 'gray'}>
                    {product.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </Table.Cell>
                <Table.Cell>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="transparent"
                      size="small"
                      onClick={() => {
                        setSelectedProduct(product)
                        setShowModal(true)
                      }}
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="transparent"
                      size="small"
                      onClick={() => handleEdit(product)}
                    >
                      <div className="w-4 h-4">✏️</div>
                    </Button>
                    <Button
                      variant="transparent"
                      size="small"
                      onClick={() => handleDelete(product.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <div className="w-4 h-4">🗑️</div>
                    </Button>
                  </div>
                </Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table>
      </div>

      {/* Product Details Modal */}
      {showModal && selectedProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto bg-ui-bg-base rounded-lg border border-ui-border-base">
            <div className="flex items-center justify-between mb-6">
              <Heading level="h3">Product Details</Heading>
              <Button
                variant="transparent"
                onClick={() => setShowModal(false)}
              >
                ×
              </Button>
            </div>
            
            <div className="space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Text className="text-sm font-medium text-ui-fg-subtle">Name</Text>
                  <Text className="font-semibold">{selectedProduct.name}</Text>
                </div>
                <div>
                  <Text className="text-sm font-medium text-ui-fg-subtle">SKU</Text>
                  <Text>{selectedProduct.sku}</Text>
                </div>
                <div>
                  <Text className="text-sm font-medium text-ui-fg-subtle">Category</Text>
                  <Badge color="blue">{selectedProduct.category}</Badge>
                </div>
                <div>
                  <Text className="text-sm font-medium text-ui-fg-subtle">Price</Text>
                  <Text className="font-semibold text-lg">{formatCurrency(selectedProduct.price)}</Text>
                </div>
              </div>

              {/* Description */}
              <div>
                <Text className="text-sm font-medium text-ui-fg-subtle mb-2">Description</Text>
                <Text>{selectedProduct.description}</Text>
              </div>

              {/* Ingredients */}
              <div>
                <Text className="text-sm font-medium text-ui-fg-subtle mb-2">Key Ingredients</Text>
                <div className="flex flex-wrap gap-2">
                  {selectedProduct.ingredients.map((ingredient, index) => (
                    <Badge key={index} color="purple">{ingredient}</Badge>
                  ))}
                </div>
              </div>

              {/* Skin Types & Concerns */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Text className="text-sm font-medium text-ui-fg-subtle mb-2">Suitable For</Text>
                  <div className="flex flex-wrap gap-2">
                    {selectedProduct.skinTypes.map((type, index) => (
                      <Badge key={index} color="green">{type}</Badge>
                    ))}
                  </div>
                </div>
                <div>
                  <Text className="text-sm font-medium text-ui-fg-subtle mb-2">Target Concerns</Text>
                  <div className="flex flex-wrap gap-2">
                    {selectedProduct.concerns.map((concern, index) => (
                      <Badge key={index} color="blue">{concern}</Badge>
                    ))}
                  </div>
                </div>
              </div>

              {/* Stock & Reviews */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Text className="text-sm font-medium text-ui-fg-subtle">Stock</Text>
                  <div className="flex items-center gap-2">
                    <Text className="text-2xl font-bold">{selectedProduct.stock}</Text>
                    <Badge color={getStockColor(selectedProduct.stock)}>
                      {getStockText(selectedProduct.stock)}
                    </Badge>
                  </div>
                </div>
                <div>
                  <Text className="text-sm font-medium text-ui-fg-subtle">Rating</Text>
                  <div className="flex items-center gap-1">
                    <Text className="text-2xl font-bold">{selectedProduct.rating}</Text>
                    <Star className="w-5 h-5 text-yellow-500 fill-current" />
                    <Text className="text-sm text-ui-fg-subtle">
                      ({selectedProduct.reviews} reviews)
                    </Text>
                  </div>
                </div>
                <div>
                  <Text className="text-sm font-medium text-ui-fg-subtle">Status</Text>
                  <Badge color={selectedProduct.is_active ? 'green' : 'gray'} className="text-lg">
                    {selectedProduct.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-2 pt-4 border-t border-ui-border-base">
                <Button variant="secondary" onClick={() => setShowModal(false)}>
                  Close
                </Button>
                <Button variant="primary">
                  <div className="w-4 h-4 mr-2">✏️</div>
                  Edit Product
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Product Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-ui-bg-base p-6 rounded-lg border border-ui-border-base w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <Heading level="h3" className="text-lg font-semibold">
                {editingId ? "Edit Product" : "Add New Product"}
              </Heading>
              <Button
                variant="transparent"
                size="small"
                onClick={handleCancel}
              >
                ✕
              </Button>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Product Name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., Hydrating Facial Cleanser"
                  required
                />
                <Input
                  label="SKU"
                  value={formData.sku}
                  onChange={(e) => setFormData(prev => ({ ...prev, sku: e.target.value }))}
                  placeholder="e.g., HFC-001"
                  required
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Category"
                  value={formData.category}
                  onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                  placeholder="e.g., Cleansers, Serums, Masks"
                  required
                />
                <Input
                  label="Price ($)"
                  type="number"
                  value={formData.price}
                  onChange={(e) => setFormData(prev => ({ ...prev, price: parseFloat(e.target.value) }))}
                  placeholder="0.00"
                  required
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Stock Quantity"
                  type="number"
                  value={formData.stock}
                  onChange={(e) => setFormData(prev => ({ ...prev, stock: parseInt(e.target.value) }))}
                  placeholder="0"
                  required
                />
                <Input
                  label="Image URL"
                  value={formData.image_url}
                  onChange={(e) => setFormData(prev => ({ ...prev, image_url: e.target.value }))}
                  placeholder="https://example.com/image.jpg"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3 py-2 border border-ui-border-base rounded-lg bg-ui-bg-base text-ui-fg-base"
                  rows={3}
                  placeholder="Detailed product description..."
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Ingredients (comma-separated)</label>
                <textarea
                  value={formData.ingredients}
                  onChange={(e) => setFormData(prev => ({ ...prev, ingredients: e.target.value }))}
                  className="w-full px-3 py-2 border border-ui-border-base rounded-lg bg-ui-bg-base text-ui-fg-base"
                  rows={2}
                  placeholder="Hyaluronic Acid, Vitamin C, Green Tea Extract"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Skin Types (comma-separated)</label>
                <textarea
                  value={formData.skinTypes}
                  onChange={(e) => setFormData(prev => ({ ...prev, skinTypes: e.target.value }))}
                  className="w-full px-3 py-2 border border-ui-border-base rounded-lg bg-ui-bg-base text-ui-fg-base"
                  rows={2}
                  placeholder="All, Oily, Dry, Combination, Sensitive"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Target Concerns (comma-separated)</label>
                <textarea
                  value={formData.concerns}
                  onChange={(e) => setFormData(prev => ({ ...prev, concerns: e.target.value }))}
                  className="w-full px-3 py-2 border border-ui-border-base rounded-lg bg-ui-bg-base text-ui-fg-base"
                  rows={2}
                  placeholder="Hydration, Anti-Aging, Brightening, Acne"
                />
              </div>
              
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={formData.is_active}
                  onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
                  className="w-4 h-4"
                />
                <label htmlFor="is_active" className="text-sm font-medium">
                  Active Product
                </label>
              </div>
              
              <div className="flex justify-end gap-2 pt-4">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={handleCancel}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                >
                  {editingId ? "Update Product" : "Add Product"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Container>
  )
}
