import MainLayout from 'layouts/MainLayout.vue'
import IndexPage from 'pages/IndexPage.vue'
import QuestionsBarChartPage from 'pages/QuestionsBarChartPage.vue'
import ExamAnalyticsPage from 'pages/ExamAnalyticsPage.vue'
import ExamplePage from 'pages/ExamplePage.vue'



const routes = [
  {
    path: '/edgar',
    component: MainLayout,
    children: [
      { path: '', component: IndexPage },
			{ path: 'questions-bar-chart', component: QuestionsBarChartPage},
			{ path: 'exam-analytics', component: ExamAnalyticsPage },
			{ path: 'example', component: ExamplePage}

    ]
	},

  {
    path: '/:catchAll(.*)*',
    component: () => import('pages/ErrorNotFound.vue')
  }
]

export default routes
