# from django.shortcuts import render
from django.contrib.auth.models import User
from rest_framework import generics
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny

from .models import Task
from .serializers import UserSerializer, ChangePasswordSerializer, TaskSerializer


class TaskListCreateView(generics.ListCreateAPIView):
    serializer_class = TaskSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        return Task.objects.filter(author=user)

    def perform_create(self, serializer):
        if serializer.is_valid():
            # .save() creates the object from the JSON data
            serializer.save(author=self.request.user)
        else:
            print(serializer.errors)


class TaskRetrieveUpdateDeleteView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = TaskSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        return Task.objects.filter(author=user)


# This declared the CREATE API for USER
class CreateUserView(generics.CreateAPIView):
    # gives list of all users in the database to check if new user already exists
    queryset = User.objects.all()

    serializer_class = UserSerializer

    # allows anyone to use this API since we want anyone to create an account
    permission_classes = [AllowAny]


# This is for GET API for USER
class GetUserView(generics.RetrieveAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]

    def get(self, request):
        username = request.user.get_username()
        queryset = self.get_queryset()
        serializer = UserSerializer(queryset.get(username=username))
        return Response(serializer.data)


# Change password for USER
class UpdatePasswordView(APIView):
    permission_classes = [IsAuthenticated]

    def put(self, request):
        user_obj = request.user
        serializer = ChangePasswordSerializer(data=request.data)
        if serializer.is_valid():
            old_password = serializer.data.get("old_password")
            if not user_obj.check_password(old_password):
                return Response(
                    {"old password": ["Wrong password"]},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            user_obj.set_password(serializer.data.get("new_password"))
            user_obj.save()
            return Response(status=status.HTTP_204_NO_CONTENT)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# NOTE: print(User.check_password(request.user, "thisiswrongpass"))
# That checks if the password is correct or wrong.
