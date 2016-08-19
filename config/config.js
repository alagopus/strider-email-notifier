var app = window.app
app.controller('EmailNotifierCtrl', ['$scope', function ($scope) {

  $scope.config = $scope.pluginConfig('emailnotifier')

  $scope.$watch('config.notify', function(newValue, oldValue) {
    if (newValue !== oldValue) {
      $scope.saving = true;
      $scope.pluginConfig('emailnotifier', $scope.config, function () {
        $scope.saving = false
      })
    }
  });

}]);
