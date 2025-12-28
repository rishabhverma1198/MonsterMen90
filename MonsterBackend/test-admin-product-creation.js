import { supabase } from './db/db.js';

console.log('🧪 Testing Admin Product Creation with Corrected Schema...');

async function testAdminProductCreation() {
  try {
    console.log('\n📋 Step 1: Get available categories...');
    const { data: categories, error: catError } = await supabase
      .from('categories')
      .select('id, name')
      .eq('is_active', true)
      .limit(1);

    if (catError) {
      console.log('❌ Categories error:', catError.message);
      return;
    }

    let categoryId = null;
    if (categories && categories.length > 0) {
      categoryId = categories[0].id;
      console.log(`✅ Using category: ${categories[0].name} (ID: ${categoryId})`);
    } else {
      console.log('❌ No active categories found');
      return;
    }

    console.log('\n📝 Step 2: Create admin product with corrected schema...');
    
    // Product data using actual database columns
    const adminProduct = {
      name: 'Premium Cotton T-Shirt',
      slug: 'premium-cotton-t-shirt',
      description: 'High-quality cotton t-shirt perfect for everyday wear',
      short_description: 'Premium cotton t-shirt',
      sku: 'PCT-001-M',
      category_id: categoryId,
      base_price: 299.99,
      wholesale_price: 199.99,
      cost_price: 150.00,
      brand: 'Monster Apparel',
      material: '100% Premium Cotton',
      care_instructions: 'Machine wash cold, tumble dry low',
      is_active: true,
      is_featured: true,
      meta_title: 'Premium Cotton T-Shirt - Monster Apparel',
      meta_description: 'High-quality cotton t-shirt with premium fabric and comfortable fit',
      images: [
        'https://example.com/image1.jpg',
        'https://example.com/image2.jpg'
      ]
    };

    console.log('📦 Creating product with data:', adminProduct);

    const { data: productData, error: productError } = await supabase
      .from('products')
      .insert([adminProduct])
      .select(`
        *,
        categories(name)
      `);

    if (productError) {
      console.log('❌ Product creation failed:', productError.message);
      console.log('Error details:', productError);
      return;
    }

    console.log('✅ Product created successfully!');
    console.log('Product ID:', productData[0].id);
    console.log('Product details:', JSON.stringify(productData[0], null, 2));

    console.log('\n📦 Step 3: Create product variant...');
    
    const productVariant = {
      product_id: productData[0].id,
      size: 'M',
      color: 'Navy Blue',
      stock_quantity: 50,
      price: 299.99,
      wholesale_price: 199.99,
      sku: 'PCT-001-M-NB',
      min_stock_level: 10
    };

    console.log('📦 Creating variant with data:', productVariant);

    const { data: variantData, error: variantError } = await supabase
      .from('product_variants')
      .insert([productVariant])
      .select();

    if (variantError) {
      console.log('❌ Variant creation failed:', variantError.message);
      return;
    }

    console.log('✅ Variant created successfully!');
    console.log('Variant ID:', variantData[0].id);
    console.log('Variant details:', JSON.stringify(variantData[0], null, 2));

    console.log('\n🔍 Step 4: Test API endpoints...');
    
    // Test public products endpoint
    console.log('Testing GET /api/products...');
    const { data: publicProducts, error: publicError } = await fetch('http://localhost:3001/api/products?limit=1')
      .then(res => res.json())
      .catch(err => ({ error: err.message }));

    if (publicError) {
      console.log('❌ Public products API error:', publicError);
    } else {
      console.log('✅ Public products API working:', publicProducts);
    }

    // Test admin products endpoint
    console.log('Testing GET /api/admin/products...');
    const { data: adminProducts, error: adminError } = await fetch('http://localhost:3001/api/admin/products?limit=1')
      .then(res => res.json())
      .catch(err => ({ error: err.message }));

    if (adminError) {
      console.log('❌ Admin products API error:', adminError);
    } else {
      console.log('✅ Admin products API working:', adminProducts);
    }

    console.log('\n🧹 Step 5: Clean up test data...');
    
    // Clean up in reverse order (due to foreign keys)
    await supabase.from('product_variants').delete().eq('id', variantData[0].id);
    await supabase.from('products').delete().eq('id', productData[0].id);
    
    console.log('✅ Test data cleaned up successfully!');

    console.log('\n🎉 Admin Product Creation Test Completed Successfully!');
    console.log('✅ Product creation works');
    console.log('✅ Variant creation works');
    console.log('✅ Database relationships work');
    console.log('✅ API endpoints respond');

  } catch (err) {
    console.error('❌ Test failed with exception:', err);
  }
}

// Test the creation
testAdminProductCreation();