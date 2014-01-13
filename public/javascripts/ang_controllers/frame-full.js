function FramesIdxCtrl($scope, $routeParams,$location,utils ) {

    $scope.frames=[];
    $scope.filteredFrames=[];
    
    
    $scope.query="";
    if($routeParams.hasOwnProperty("search"))
    {
        $scope.query=$routeParams.search;
    }
    $scope.currentPage = 0;
    $scope.pageSize = 30;
    
    $scope.updateFilteredFrames=function()
    {
        var newList=[];
        if($scope.frames instanceof Array )
        {
            for(var i =0;i<$scope.frames.length;i++)
            {
                if ($scope.frames[i].frame['@name'].toLowerCase().indexOf($scope.query.toLowerCase())!==-1)
                {
                    newList.push($scope.frames[i]);
                }
            }
        }
        $scope.filteredFrames=newList;
        var numOfPages=$scope.numberOfPages();
        if($scope.currentPage>numOfPages)
        {
            $scope.currentPage=numOfPages-1;
        }
        
    };
    
    $scope.$watch('query', function(newValue, oldValue) {$scope.updateFilteredFrames();$location.search('search',newValue);});
    $scope.$watch('frames', function(newValue, oldValue) {$scope.updateFilteredFrames();});
   
    utils.CallServerGet("eng/framenames",{},function(out)
        {
            $scope.frames=out;
            if($routeParams.hasOwnProperty("frame"))
            {
                $scope.chooseFrame($routeParams.frame);
            }
            else
            {
                $scope.chooseFrame($scope.frames[0].frame['@name']  );
            }

            $scope.$apply();
        });
    

    $scope.selectedFrame=[];
    $scope.chooseFrame=function(name)
    {
        utils.LoadResponseToDiv(
            "selected-frame-info",
            "heb/framedata",
            {framename:name},
            function(out){
                $location.search('frame',name);
                $scope.selectedFrame=out;
                $scope.$apply();
            } );  
    };

    

    $scope.shortendString=utils.shortendString;
    
    //$scope.stripTags=utils.stripTags;
  
    /*$scope.nameFilter=function(item){
        if($scope.query==="")
        {
            return true;
        }
        if( (typeof item !== 'undefined') &&
            (item.hasOwnProperty('frame')) &&
            (item.frame.hasOwnProperty('@name') ))
            {
            return item.frame['@name'].toLowerCase().indexOf($scope.query.toLowerCase())!=-1;
            }
        return false;
    };*/
    
    
    
    
    
    $scope.numberOfPages=function(){
        if($scope.filteredFrames instanceof Array)
        {
            if($scope.filteredFrames.length===0)
            {
                return 1;
            }
            return Math.ceil($scope.filteredFrames.length/$scope.pageSize);    
        }
        else
        {
            return 1;
        }
    };

}