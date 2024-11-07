const jwt = require('jsonwebtoken')
const blogsRouter = require('express').Router()
const Blog = require('../models/blog')
const User = require('../models/user')
const { authenticate } = require('../utils/auth')
const { userExtractor } = require('../utils/jwt')

blogsRouter.get('/',userExtractor, async (request, response) => {
  try{
    const blogs = await Blog.find({}).populate('user', { username: 1, name: 1})
  response.json(blogs)
  } catch (error) {
    response.status(500).json({ error: error.message })
  }
  
  
  // Blog.find({}).then(blogs => {
  //   response.json(blogs)
  // })
})


blogsRouter.post('/', userExtractor, authenticate, async (request, response) => {
  const { title, author, url, likes } = request.body

  

  if (!title || !url) {
    return response.status(400).json({ error: 'title and url must be provided' })
  }

  // const user = await User.findById({ _id: request.user.id})


  try {
    // const decodedToken = jwt.verify(request.token, process.env.SECRET)
    const decodedToken = request.user
    console.log('decodedToken', decodedToken)

    if (!decodedToken.id) {
      return response.status(401).json({ error: 'invalid token' })
    }

  

  const user = await User.findById(decodedToken.id)

  console.log('user', user)


  

  const blog = new Blog({
    title,
    author,
    url,
    likes: likes !== undefined ? likes : 0,
    user: user._id,
  })

  
    const savedBlog = await blog.save()
    
    user.blogs.push(savedBlog._id)
    await user.save()
    response.status(201).json(savedBlog)
  } catch (error) {
    console.log('error creating blog', error.message)
    response.status(400).json({ error: 'internal server error' })
  }

})



blogsRouter.delete('/:id', userExtractor, authenticate,async (request, response, next) => {
  try {
    const blog = await Blog.findById(request.params.id)

    if (!blog) {
      return response.status(404).json({ error: 'blog not found' })
    }

    if (blog.user.toString() !== request.user.id.toString()) {
      return response.status(401).json({ error: 'unauthorized' })
    }

    await Blog.findByIdAndDelete(request.params.id).then(result => {
      response.status(204).end()
    })
  } catch (error) {
    response.status(500).json({ error: error.message })
  }
})


blogsRouter.put('/:id', async (request, response, next) => {
  const { likes } = request.body

  const updatedBlog = await Blog.findByIdAndUpdate(
    request.params.id, 
    { likes }, 
    { new: true, runValidators: true, context: 'query' }
  )

  if (updatedBlog) {
    response.json(updatedBlog)
  } else {
    response.status(404).end()
  }
})



  // const blog = new Blog(request.body)
  // const savedBlog = await blog.save()
  // response.status(201).json(savedBlog)
  // blog.save().then(result => {
  //   response.status(201).json(result)
  // })


module.exports = blogsRouter
